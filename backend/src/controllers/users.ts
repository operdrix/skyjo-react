import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import mjml2html from "mjml";
import nodemailer from "nodemailer";
import { Op } from "sequelize";
import User from "../models/users.js";
import { UserAttributes } from "../types/index.js";

dotenv.config();

interface UserData {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface FastifyApp {
  bcrypt: {
    hash: (password: string) => Promise<string>;
    compare: (password: string, hash: string) => Promise<boolean>;
  };
  jwt: {
    sign: (payload: any, options: { expiresIn: string }) => string;
  };
}

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_APP_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    }
  });
}

function getMJMLTemplate(firstname: string, confirmLink: string): string {
  const mjmlFilePath = "./src/templates/confirmation.mjml";
  const emailTemplate = fs.readFileSync(mjmlFilePath, "utf8");
  const mjmlTemplate = emailTemplate
    .replace(/{{firstname}}/g, firstname)
    .replace(/{{confirmLink}}/g, confirmLink);
  const { html } = mjml2html(mjmlTemplate);
  return html;
}

function getMJMLTemplateResetPassword(username: string, confirmLink: string): string {
  const mjmlFilePath = "./src/templates/reset-password.mjml";
  const emailTemplate = fs.readFileSync(mjmlFilePath, "utf8");
  const mjmlTemplate = emailTemplate
    .replace(/{{username}}/g, username)
    .replace(/{{confirmLink}}/g, confirmLink);
  const { html } = mjml2html(mjmlTemplate);
  return html;
}

function getMJMLTemplateResetPasswordConfirm(firstname: string, confirmLink: string): string {
  const mjmlFilePath = "./src/templates/reset-password-confirm.mjml";
  const emailTemplate = fs.readFileSync(mjmlFilePath, "utf8");
  const mjmlTemplate = emailTemplate
    .replace(/{{firstname}}/g, firstname)
    .replace(/{{confirmLink}}/g, confirmLink);
  const { html } = mjml2html(mjmlTemplate);
  return html;
}

async function generateID(id: string): Promise<string> {
  const { count } = await findAndCountAllUsersById(id);
  if (count > 0) {
    id = id.substring(0, 5);
    const { count } = await findAndCountAllUsersById(id);
    id = id + (count + 1);
  }
  return id;
}

export async function getUsers(): Promise<UserAttributes[]> {
  return await User.findAll({
    attributes: ['id', 'username', 'firstname', 'lastname', 'email', 'bestScore', 'avatar']
  });
}

export async function getUserById(id: string): Promise<UserAttributes | null> {
  return await User.findByPk(id, {
    attributes: ['id', 'username', 'firstname', 'lastname', 'email', 'bestScore', 'avatar']
  });
}

export async function findAndCountAllUsersById(id: string): Promise<{ count: number }> {
  return await User.findAndCountAll({
    where: {
      id: {
        [Op.like]: `${id}%`,
      },
    },
  });
}

export async function findAndCountAllUsersByEmail(email: string): Promise<{ count: number, rows: UserAttributes[] }> {
  return await User.findAndCountAll({
    where: {
      email: {
        [Op.eq]: email,
      },
    },
  });
}

export async function findAndCountAllUsersByUsername(username: string): Promise<{ count: number }> {
  return await User.findAndCountAll({
    where: {
      username: {
        [Op.eq]: username,
      },
    },
  });
}

export async function registerUser(userDatas: UserData, bcrypt: { hash: (password: string) => Promise<string> }): Promise<UserAttributes | { error: string; code: number }> {
  if (!userDatas) {
    return { error: "Aucune donnée à enregistrer", code: 400 };
  }
  const { firstname, lastname, username, email, password, avatar } = userDatas;
  if (!firstname || !lastname || !username || !email || !password) {
    return { error: "Tous les champs sont obligatoires", code: 400 };
  }

  const { count: emailCount } = await findAndCountAllUsersByEmail(email);
  if (emailCount > 0) {
    return { error: "L'adresse email est déjà utilisée.", code: 400 };
  }

  const { count: usernameCount } = await findAndCountAllUsersByUsername(username);
  if (usernameCount > 0) {
    return { error: "Le nom d'utilisateur est déjà utilisé.", code: 400 };
  }

  let id = await generateID((lastname.substring(0, 3) + firstname.substring(0, 3)).toUpperCase());
  const hashedPassword = await bcrypt.hash(password);
  const generateToken = crypto.randomBytes(32).toString('hex');

  const user = {
    id,
    firstname,
    lastname,
    username,
    email,
    avatar,
    password: hashedPassword,
    verifiedtoken: generateToken,
    verified: false
  };

  const newUser = await User.create(user);

  if (newUser) {
    const transporter = createTransporter();
    const mailOptions = {
      from: 'olivperdrix@gmail.com',
      to: newUser.email,
      subject: 'Confirmation d\'inscription',
      html: getMJMLTemplate(newUser.firstname, `${process.env.FRONTEND_HOST}/auth/verify/${newUser.verifiedtoken}`),
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email de confirmation envoyé avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    }
  }

  return newUser;
}

export async function loginUser(userDatas: LoginData, app: FastifyApp): Promise<{ token: string; user: { id: string; username: string } } | { error: string; code: number }> {
  if (!userDatas) {
    return { error: "Aucune donnée n'a été envoyée", code: 400 };
  }
  const { email, password } = userDatas;
  if (!email || !password) {
    return { error: "Tous les champs sont obligatoires", code: 400 };
  }

  const { count, rows } = await findAndCountAllUsersByEmail(email);
  if (count === 0) {
    return {
      error: "Il n'y a pas d'utilisateur associé à cette adresse email.",
      code: 400
    };
  } else if (rows[0].verified === false) {
    return {
      error: "Votre compte n'est pas encore vérifié.<br>Veuillez vérifier votre boîte mail.",
      code: 400
    };
  }

  const user = await User.findOne({
    where: {
      email: {
        [Op.eq]: email,
      },
    },
  });

  if (!user) {
    return { error: "Utilisateur non trouvé", code: 400 };
  }

  const match = await app.bcrypt.compare(password, user.password);
  if (!match) {
    return { error: "Mot de passe incorrect", code: 400 };
  }

  const token = app.jwt.sign(
    { id: user.id, username: user.username },
    { expiresIn: "14d" }
  );

  return { token, user: { id: user.id, username: user.username } };
}

export async function verifyUser(token: string): Promise<UserAttributes | { error: string; code: number }> {
  const user = await User.findOne({
    where: {
      verifiedtoken: {
        [Op.eq]: token,
      },
    },
  });

  if (!user) {
    return { error: "Une erreur est survenue. Demander un nouvel email de confirmation.", code: 400 };
  }

  user.verified = true;
  user.verifiedtoken = null;
  await user.save();
  return user;
}

export async function requestPasswordReset(email: string): Promise<{ message: string; code: number } | { error: string; code: number }> {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return { error: "Aucun utilisateur trouvé avec cet email.", code: 400 };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000);
  await user.save();

  const transporter = createTransporter();
  const resetLink = `${process.env.FRONTEND_HOST}/auth/password-reset/${resetToken}`;
  const mailOptions = {
    from: 'olivperdrix@gmail.com',
    to: user.email,
    subject: "Réinitialisation de mot de passe",
    html: getMJMLTemplateResetPassword(user.username, resetLink),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { message: "Email de réinitialisation envoyé avec succès.", code: 200 };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
    return { error: "Erreur lors de l'envoi de l'email de réinitialisation.", code: 500 };
  }
}

export async function resetPassword(token: string, newPassword: string, bcrypt: { hash: (password: string) => Promise<string> }): Promise<{ message: string; code: number } | { error: string; code: number }> {
  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [Op.gt]: new Date() }
    }
  });

  if (!user) {
    return { error: "Le lien de réinitialisation est invalide ou a expiré.", code: 400 };
  }

  const hashedPassword = await bcrypt.hash(newPassword);
  user.password = hashedPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: "Mot de passe réinitialisé avec succès.", code: 200 };
} 