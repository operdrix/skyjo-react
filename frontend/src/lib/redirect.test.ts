import { goToLogin, goToRegister, safeRedirect, withRedirect } from "@/lib/redirect";
import { dismissToast, getToasts } from "@/lib/toast";
import { describe, expect, it, vi } from "vitest";

describe("safeRedirect", () => {
  it("garde un chemin interne", () => {
    expect(safeRedirect("/join/42")).toBe("/join/42");
  });

  it("renvoie vers l'accueil sans chemin ou avec une adresse externe", () => {
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect("")).toBe("/");
    expect(safeRedirect("https://exemple.test")).toBe("/");
    expect(safeRedirect("//exemple.test")).toBe("/");
    expect(safeRedirect("/\\exemple.test")).toBe("/");
  });
});

describe("withRedirect", () => {
  it("ajoute la page de retour à l'adresse", () => {
    expect(withRedirect("/auth/login", "/join/42")).toBe("/auth/login?redirect=%2Fjoin%2F42");
  });

  it("n'ajoute rien pour un retour à l'accueil", () => {
    expect(withRedirect("/auth/login", "/")).toBe("/auth/login");
  });
});

describe("goToLogin", () => {
  it("affiche un message éphémère et ouvre la connexion en gardant la page de retour", () => {
    const navigate = vi.fn();
    goToLogin(navigate, "/join/42", "Connecte-toi pour rejoindre la partie");

    expect(navigate).toHaveBeenCalledWith("/auth/login?redirect=%2Fjoin%2F42");
    expect(getToasts()).toMatchObject([
      { type: "info", title: "Connexion requise", message: "Connecte-toi pour rejoindre la partie" },
    ]);
    getToasts().forEach((t) => dismissToast(t.id));
  });
});

describe("goToRegister", () => {
  it("affiche un message éphémère et ouvre l'inscription", () => {
    const navigate = vi.fn();

    goToRegister(navigate, "Crée un compte pour créer une partie.");

    expect(navigate).toHaveBeenCalledWith("/auth/register");
    expect(getToasts()).toMatchObject([{ message: "Crée un compte pour créer une partie." }]);
    getToasts().forEach((t) => dismissToast(t.id));
  });
});
