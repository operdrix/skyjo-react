import { afterEach, describe, expect, it, vi } from "vitest";
import { createTransporter } from "./mailer.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createTransporter", () => {
  it("utilise le serveur SMTP indiqué par SMTP_HOST (Mailpit en dev)", () => {
    vi.stubEnv("SMTP_HOST", "mailpit");
    vi.stubEnv("SMTP_PORT", "1025");

    const { options } = createTransporter();

    expect(options.host).toBe("mailpit");
    expect(options.port).toBe(1025);
    expect(options.service).toBeUndefined();
  });

  it("utilise Gmail quand SMTP_HOST est vide (production)", () => {
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("GMAIL_APP_EMAIL", "skyjo@example.com");

    const { options } = createTransporter();

    expect(options.service).toBe("gmail");
    expect(options.auth?.user).toBe("skyjo@example.com");
  });
});
