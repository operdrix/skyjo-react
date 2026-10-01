import nodemailer from "nodemailer";

// SMTP_HOST défini (Mailpit en dev et recette) : serveur SMTP local sans authentification.
// Sinon (production) : compte Gmail.
export function createTransporter() {
	if (process.env.SMTP_HOST) {
		return nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT || 1025),
			secure: false,
		});
	}

	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.GMAIL_APP_EMAIL,
			pass: process.env.GMAIL_APP_PASSWORD,
		}
	});
}
