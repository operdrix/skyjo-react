import { describe, expect, it } from "vitest";
import { gameKindFrom } from "./gameKind";

describe("gameKindFrom", () => {
  it("lit le jeu configuré", () => {
    expect(gameKindFrom("banco")).toBe("banco");
    expect(gameKindFrom("colonnes")).toBe("colonnes");
  });

  it("prend colonnes par défaut, ou pour un jeu inconnu", () => {
    expect(gameKindFrom(undefined)).toBe("colonnes");
    expect(gameKindFrom("inconnu")).toBe("colonnes");
  });
});
