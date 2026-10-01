import { buildApp } from "../src/app.js";
import { sequelize } from "../src/bdd.js";
import "../src/models/games.js";
import User from "../src/models/users.js";

const PASSWORD = "secret-de-test";

// App neuve sur une base vide
export async function setupApp() {
  await sequelize.sync({ force: true });
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function closeApp(app) {
  await app.close();
}

// Crée un compte vérifié et retourne ses cookies de session
export async function createPlayer(app, name) {
  const hashed = await app.bcrypt.hash(PASSWORD);
  const user = await User.create({
    id: name.toUpperCase(),
    firstname: name,
    lastname: name,
    username: name,
    email: `${name}@test.local`,
    password: hashed,
    verified: true,
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { email: user.email, password: PASSWORD },
  });
  const cookies = Object.fromEntries(response.cookies.map(cookie => [cookie.name, cookie.value]));
  return { id: user.id, cookies };
}

export const SENSITIVE_FIELDS = ["password", "email", "verifiedtoken", "resetPasswordToken"];

// Liste les clés sensibles présentes à n'importe quelle profondeur
export function findSensitiveFields(value, path = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findSensitiveFields(item, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [
      ...(SENSITIVE_FIELDS.includes(key) ? [`${path}.${key}`] : []),
      ...findSensitiveFields(child, `${path}.${key}`),
    ]);
  }
  return [];
}
