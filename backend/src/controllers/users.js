import crypto from "crypto";
import fs from "fs";
import mjml2html from "mjml";
import nodemailer from "nodemailer";
import { Op } from "sequelize";
import User from "../models/users.js";

import dotenv from "dotenv";

dotenv.config();

function createTransporter() {
	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.GMAIL_APP_EMAIL,
			pass: process.env.GMAIL_APP_PASSWORD,
		}
	});
}

function getMJMLTemplate(firstname, confirmLink) {
	const mjmlFilePath = "./src/templates/confirmation.mjml";
	const emailTemplate = fs.readFileSync(mjmlFilePath, "utf8");
	const mjmlTemplate = emailTemplate
		.replace(/{{firstname}}/g, firstname)
		.replace(/{{confirmLink}}/g, confirmLink);
	const { html } = mjml2html(mjmlTemplate);
	return html;
}

function getMJMLTemplateResetPassword(username, confirmLink) {
	const mjmlFilePath = "./src/templates/reset-password.mjml";
	const emailTemplate = fs.readFileSync(mjmlFilePath, "utf8");
	const mjmlTemplate = emailTemplate
		.replace(/{{username}}/g, username)
		.replace(/{{confirmLink}}/g, confirmLink);
	const { html } = mjml2html(mjmlTemplate);
	return html;
}

function getMJMLTemplateResetPasswordConfirm(firstname, confirmLink) {
	const mjmlFilePath = "./src/templates/reset-password-confirm.mjml";
	const emailTemplate = fs.readFileSync(mjmlFilePath, "utf8");
	const mjmlTemplate = emailTemplate
		.replace(/{{firstname}}/g, firstname)
		.replace(/{{confirmLink}}/g, confirmLink);
	const { html } = mjml2html(mjmlTemplate);
	return html;
}

async function generateID(id) {
	const { count } = await findAndCountAllUsersById(id);
	if (count > 0) {
		id = id.substring(0, 5);
		const { count } = await findAndCountAllUsersById(id);
		id = id + (count + 1);
	}
	return id;
}

export async function getUsers() {
	return await User.findAll({
		attributes: ["id", "username", "firstname", "lastname", "email", "bestScrore", "avatar"]
	});
}
export async function getUserById(id) {
	return await User.findByPk(id, {
		attributes: ["id", "username", "firstname", "lastname", "email", "bestScrore", "avatar"]
	});
}
export async function findAndCountAllUsersById(id) {
	return await User.findAndCountAll({
		where: {
			id: {
				[Op.like]: `${id}%`,
			},
		},
	});
}
export async function findAndCountAllUsersByEmail(email) {
	return await User.findAndCountAll({
		where: {
			email: {
				[Op.eq]: email,
			},
		},
	});
}
export async function findAndCountAllUsersByUsername(username) {
	return await User.findAndCountAll({
		where: {
			username: {
				[Op.eq]: username,
			},
		},
	});
}
export async function registerUser(userDatas, bcrypt) {
	if (!userDatas) {
		return { error: "Aucune donnée à enregistrer", code: 400 };
	}
	const { firstname, lastname, username, email, password, avatar } = userDatas;
	if (!firstname || !lastname || !username || !email || !password) {
		return { error: "Tous les champs sont obligatoires", code: 400 };
	}
	//vérification que l'email n'est pas déjà utilisé
	const { count: emailCount } = await findAndCountAllUsersByEmail(email);
	if (emailCount > 0) {
		return { error: "L'adresse email est déjà utilisée.", code: 400 };
	}

	//vérification que le pseudo n'est pas déjà utilisé
	const { count: usernameCount } = await findAndCountAllUsersByUsername(
		username
	);
	if (usernameCount > 0) {
		return { error: "Le nom d'utilisateur est déjà utilisé.", code: 400 };
	}
	//création de l'identifiant
	let id = await generateID(
		(lastname.substring(0, 3) + firstname.substring(0, 3)).toUpperCase()
	);
	//hashage du mot de passe
	const hashedPassword = await bcrypt.hash(password);
	//génération du token de vérification
	const generateToken = crypto.randomBytes(32).toString("hex");

	//création de l'utilisateur dans la base de données
	const user = {
		id,
		firstname,
		lastname,
		username,
		email,
		avatar,
		password: hashedPassword,
		verifiedtoken: generateToken,
	};

	const newUser = await User.create(user);

	// Si l'utilisateur est bien créé, envoyer un email de confirmation
	if (newUser) {
		const transporter = createTransporter();

		const mailOptions = {
			from: "olivperdrix@gmail.com",
			to: newUser.email,
			subject: "Confirmation d'inscription",
			html: getMJMLTemplate(newUser.firstname, `${process.env.FRONTEND_HOST}/auth/verify/${newUser.verifiedtoken}`),
		};

		try {
			await transporter.sendMail(mailOptions);
			console.log("Email de confirmation envoyé avec succès.");
		} catch (error) {
			console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
			// tu peux aussi logger cette erreur pour la gestion des erreurs
		}
	}

	return newUser;
}
export async function loginUser(userDatas, app) {
	if (!userDatas) {
		return { error: "Aucune donnée n'a été envoyée", code: 400 };
	}
	const { email, password } = userDatas;
	if (!email || !password) {
		return { error: "Tous les champs sont obligatoires", code: 400 };
	}
	//vérification que l'email est utilisé
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
	//récupération de l'utilisateur
	const user = await User.findOne({
		where: {
			email: {
				[Op.eq]: email,
			},
		},
	});
	//comparaison des mots de passe
	const match = await app.bcrypt.compare(password, user.password);
	if (!match) {
		return { error: "Mot de passe incorrect", code: 400 };
	}
	// Générer le JWT après une authentification réussie
	const token = app.jwt.sign(
		{ id: user.id, username: user.username },
		{ expiresIn: "14d" }
	);
	return { token, user: { id: user.id, username: user.username } };
}

export async function verifyUser(token) {
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

export async function requestPasswordReset(email) {
	// Vérifier si l'utilisateur existe
	const user = await User.findOne({ where: { email } });
	if (!user) {
		return { error: "Aucun utilisateur trouvé avec cet email.", code: 400 };
	}

	// Générer un token et une date d'expiration
	const resetToken = crypto.randomBytes(32).toString("hex");
	user.resetPasswordToken = resetToken;
	user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
	await user.save();

	// Envoyer l'email avec le lien de réinitialisation
	const transporter = createTransporter();
	const resetLink = `${process.env.FRONTEND_HOST}/auth/password-reset/${resetToken}`;
	const mailOptions = {
		from: "olivperdrix@gmail.com",
		to: user.email,
		subject: "Réinitialisation de mot de passe",
		html: getMJMLTemplateResetPassword(user.username, resetLink),
	};

	try {
		await transporter.sendMail(mailOptions);
		return { message: "Email de réinitialisation envoyé avec succès.", code: 200 };
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email :", error);
		return { error: "Impossible d'envoyer l'email.", code: 500 };
	}
}

export async function resetPassword(token, newPassword, bcrypt) {

	// Trouver l'utilisateur avec le token et vérifier son expiration
	const user = await User.findOne({
		where: {
			resetPasswordToken: token,
			resetPasswordExpires: { [Op.gt]: Date.now() },
		},
	});

	if (!user) {
		return { error: "Token invalide ou expiré.", code: 400 };
	}

	// Hasher le nouveau mot de passe
	const hashedPassword = await bcrypt.hash(newPassword);
	user.password = hashedPassword;
	user.resetPasswordToken = null;
	user.resetPasswordExpires = null;
	await user.save();

	// Envoyer l'email avec le lien de réinitialisation
	const transporter = createTransporter();
	const resetLink = `${process.env.FRONTEND_HOST}/auth/login`;
	const mailOptions = {
		from: "olivperdrix@gmail.com",
		to: user.email,
		subject: "Mot de passe réinitialisé",
		html: getMJMLTemplateResetPasswordConfirm(user.firstname, resetLink),
	};

	try {
		await transporter.sendMail(mailOptions);
		return { message: "Mot de passe réinitialisé avec succès.", code: 200 };
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email :", error);
		return { error: "Impossible d'envoyer l'email.", code: 500 };
	}


};