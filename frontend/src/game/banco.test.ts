import { describe, expect, it } from "vitest";
import { handTotal } from "@/game/banco";

const hand = (...values: number[]) => values.map((value, index) => ({ id: `c${index}`, value }));

describe("handTotal", () => {
  it("additionne les nombres d'un joueur en jeu ou arrêté", () => {
    expect(handTotal(hand(3, 10, 0), "playing")).toBe(13);
    expect(handTotal(hand(5), "stopped")).toBe(5);
  });

  it("vaut 0 pour un joueur éliminé", () => {
    expect(handTotal(hand(4, 4), "busted")).toBe(0);
  });

  it("ajoute 15 pour 7 nombres différents", () => {
    expect(handTotal(hand(0, 1, 2, 3, 4, 5, 6), "playing")).toBe(21 + 15);
  });
});
