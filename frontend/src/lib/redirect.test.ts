import { safeRedirect, withRedirect } from "@/lib/redirect";
import { describe, expect, it } from "vitest";

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
