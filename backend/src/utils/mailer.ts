import fs from "node:fs";
import mjml2html from "mjml";
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
    },
  });
}

// Rend un gabarit MJML de src/templates en remplaçant les {{variables}}
export async function renderTemplate(name: string, variables: Record<string, string>) {
  const template = fs.readFileSync(`./src/templates/${name}.mjml`, "utf8");
  const mjml = Object.entries(variables).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template,
  );
  const { html } = await mjml2html(mjml);
  return html;
}

export async function sendMail(to: string, subject: string, html: string) {
  await createTransporter().sendMail({ from: "olivperdrix@gmail.com", to, subject, html });
}
