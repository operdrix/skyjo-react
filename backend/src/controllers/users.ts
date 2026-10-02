import crypto from "node:crypto";
import fs from "node:fs";
import { and, eq, gt, like } from "drizzle-orm";
import mjml2html from "mjml";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { logger } from "../utils/logger.ts";
import { createTransporter } from "../utils/mailer.ts";

export type PasswordHasher = {
	hash: (password: string) => Promise<string>;
	compare: (password: string, hash: string) => Promise<boolean>;
};

type RegisterData = {
	firstname?: string;
	lastname?: string;
	username?: string;
	email?: string;
	password?: string;
	avatar?: string;
};

// Profil exposé par l'API
const PROFILE = {
	id: users.id,
	username: users.username,
	firstname: users.firstname,
	lastname: users.lastname,
	email: users.email,
	bestScore: users.bestScore,
	avatar: users.avatar,
};

// Rend un gabarit MJML de src/templates en remplaçant les {{variables}}
async function renderTemplate(name: string, variables: Record<string, string>) {
	const template = fs.readFileSync(`./src/templates/${name}.mjml`, "utf8");
	const mjml = Object.entries(variables).reduce(
		(content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
		template,
	);
	const { html } = await mjml2html(mjml);
	return html;
}

async function sendMail(to: string, subject: string, html: string) {
	await createTransporter().sendMail({ from: "olivperdrix@gmail.com", to, subject, html });
}

async function countUsersByIdPrefix(prefix: string) {
	const rows = await db.select({ id: users.id }).from(users).where(like(users.id, `${prefix}%`));
	return rows.length;
}

// Identifiant lisible : 3 lettres du nom + 3 du prénom, suffixé en cas de doublon
async function generateID(id: string) {
	if (await countUsersByIdPrefix(id) > 0) {
		const prefix = id.substring(0, 5);
		return prefix + (await countUsersByIdPrefix(prefix) + 1);
	}
	return id;
}

async function findUserByEmail(email: string) {
	return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function getUsers() {
	return db.select(PROFILE).from(users);
}

export async function getUserById(id: string) {
	const [user] = await db.select(PROFILE).from(users).where(eq(users.id, id));
	return user ?? null;
}

export async function registerUser(userDatas: RegisterData | undefined, bcrypt: PasswordHasher) {
	if (!userDatas) {
		return { error: "Aucune donnée à enregistrer", code: 400 };
	}
	const { firstname, lastname, username, email, password, avatar } = userDatas;
	if (!firstname || !lastname || !username || !email || !password) {
		return { error: "Tous les champs sont obligatoires", code: 400 };
	}
	if (await findUserByEmail(email)) {
		return { error: "L'adresse email est déjà utilisée.", code: 400 };
	}
	if (await db.query.users.findFirst({ where: eq(users.username, username) })) {
		return { error: "Le nom d'utilisateur est déjà utilisé.", code: 400 };
	}

	const id = await generateID((lastname.substring(0, 3) + firstname.substring(0, 3)).toUpperCase());
	const verifiedToken = crypto.randomBytes(32).toString("hex");
	const newUser = {
		id,
		firstname,
		lastname,
		username,
		email,
		avatar,
		password: await bcrypt.hash(password),
		verifiedToken,
		verifiedTokenExpires: new Date(Date.now() + 24 * 3600000), // 24 heures
	};
	await db.insert(users).values(newUser);

	try {
		const link = `${process.env.FRONTEND_HOST}/auth/verify/${verifiedToken}`;
		await sendMail(email, "Confirmation d'inscription", await renderTemplate("confirmation", { firstname, confirmLink: link }));
		logger.info("Email de confirmation envoyé avec succès.");
	} catch (error) {
		logger.error("Erreur lors de l'envoi de l'email de confirmation:", error);
	}

	return { id, username, email };
}

export async function loginUser(userDatas: { email?: string; password?: string } | undefined, bcrypt: PasswordHasher) {
	if (!userDatas) {
		return { error: "Aucune donnée n'a été envoyée", code: 400 };
	}
	const { email, password } = userDatas;
	if (!email || !password) {
		return { error: "Tous les champs sont obligatoires", code: 400 };
	}
	const user = await findUserByEmail(email);
	if (!user) {
		return { error: "Login ou mot de passe incorrect", code: 400 };
	}
	if (!user.verified) {
		return {
			error: "Votre compte n'est pas encore vérifié.\nVeuillez vérifier votre boîte mail.",
			code: 400
		};
	}
	if (!await bcrypt.compare(password, user.password)) {
		return { error: "Login ou mot de passe incorrect", code: 400 };
	}
	return {
		user: {
			id: user.id,
			username: user.username,
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			avatar: user.avatar
		}
	};
}

export async function verifyUser(token: string) {
	const user = await db.query.users.findFirst({
		where: and(eq(users.verifiedToken, token), gt(users.verifiedTokenExpires, new Date())),
	});
	if (!user) {
		return { error: "Token invalide ou expiré. Demandez un nouvel email de confirmation.", code: 400 };
	}
	await db.update(users)
		.set({ verified: true, verifiedToken: null, verifiedTokenExpires: null })
		.where(eq(users.id, user.id));
	return { id: user.id, username: user.username, verified: true };
}

export async function requestPasswordReset(email: string) {
	const user = await findUserByEmail(email);
	if (!user) {
		return { error: "Aucun utilisateur trouvé avec cet email.", code: 400 };
	}

	const resetToken = crypto.randomBytes(32).toString("hex");
	await db.update(users)
		.set({ resetPasswordToken: resetToken, resetPasswordExpires: new Date(Date.now() + 3600000) }) // 1 heure
		.where(eq(users.id, user.id));

	try {
		const link = `${process.env.FRONTEND_HOST}/auth/password-reset/${resetToken}`;
		await sendMail(user.email, "Réinitialisation de mot de passe", await renderTemplate("reset-password", { username: user.username, confirmLink: link }));
		return { message: "Email de réinitialisation envoyé avec succès.", code: 200 };
	} catch (error) {
		logger.error("Erreur lors de l'envoi de l'email :", error);
		return { error: "Impossible d'envoyer l'email.", code: 500 };
	}
}

export async function resetPassword(token: string, newPassword: string, bcrypt: PasswordHasher) {
	const user = await db.query.users.findFirst({
		where: and(eq(users.resetPasswordToken, token), gt(users.resetPasswordExpires, new Date())),
	});
	if (!user) {
		return { error: "Token invalide ou expiré.", code: 400 };
	}

	await db.update(users)
		.set({ password: await bcrypt.hash(newPassword), resetPasswordToken: null, resetPasswordExpires: null })
		.where(eq(users.id, user.id));

	try {
		const link = `${process.env.FRONTEND_HOST}/auth/login`;
		await sendMail(user.email, "Mot de passe réinitialisé", await renderTemplate("reset-password-confirm", { firstname: user.firstname, confirmLink: link }));
		return { message: "Mot de passe réinitialisé avec succès.", code: 200 };
	} catch (error) {
		logger.error("Erreur lors de l'envoi de l'email :", error);
		return { error: "Impossible d'envoyer l'email.", code: 500 };
	}
}
