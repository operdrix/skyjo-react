import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";

const saved = { JWT_SECRET: process.env.JWT_SECRET, COOKIE_SECRET: process.env.COOKIE_SECRET };

afterEach(() => {
  Object.assign(process.env, saved);
});

describe("secrets obligatoires", () => {
  it.each(["JWT_SECRET", "COOKIE_SECRET"])("refuse de démarrer sans %s", async (name) => {
    delete process.env[name];

    const outcome = await buildApp().then(
      async (app) => { await app.close(); return "démarrée"; },
      (error: Error) => error.message,
    );

    expect(outcome).toContain(name);
  });
});
