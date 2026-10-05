import { guestPseudo, PSEUDO_MAX, PSEUDO_MIN, PSEUDO_PATTERN, suggestPseudo } from "@/lib/pseudo";
import { describe, expect, it } from "vitest";

describe("suggestPseudo", () => {
  it("garde un prénom accentué", () => {
    expect(suggestPseudo("Inès")).toBe("Inès");
  });

  it("retire les caractères refusés et coupe à 30 caractères", () => {
    expect(suggestPseudo("Jean-Ève 🎲")).toBe("Jean-Ève");
    expect(suggestPseudo("a".repeat(40))).toHaveLength(30);
  });

  it("ne propose rien de trop court", () => {
    expect(suggestPseudo("Al")).toBe("");
    expect(suggestPseudo(undefined)).toBe("");
  });
});

describe("pseudo proposé à un invité", () => {
  it("respecte les règles des pseudos, quel que soit le tirage", () => {
    for (const draw of [0, 0.25, 0.5, 0.999]) {
      const pseudo = guestPseudo(() => draw);
      expect(pseudo.length).toBeGreaterThanOrEqual(PSEUDO_MIN);
      expect(pseudo.length).toBeLessThanOrEqual(PSEUDO_MAX);
      expect(PSEUDO_PATTERN.test(pseudo)).toBe(true);
    }
  });

  it("varie d'un tirage à l'autre", () => {
    expect(guestPseudo(() => 0)).not.toBe(guestPseudo(() => 0.999));
  });
});
