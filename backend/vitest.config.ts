import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.{js,ts}"],
          exclude: ["src/**/*.api.test.{js,ts}"],
        },
      },
      {
        // Tests d'API : MySQL requis (`make db-up`), base dédiée vidée à chaque fichier
        test: {
          name: "api",
          include: ["src/**/*.api.test.{js,ts}"],
          globalSetup: ["test/global-setup.ts"],
          fileParallelism: false,
          env: {
            NODE_ENV: "test",
            DB_NAME: "skyjo_test",
            BETTER_AUTH_SECRET: "secret-better-auth-de-test-32-caracteres",
            GOOGLE_CLIENT_ID: "",
            GOOGLE_CLIENT_SECRET: "",
            SMTP_HOST: "localhost",
            SMTP_PORT: "1025",
          },
        },
      },
    ],
  },
});
