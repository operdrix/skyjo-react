import { describe, expect, it } from "vitest";
import { cardLabel, handTotal } from "@/game/banco";
import type { BancoCard } from "../../../shared/types";

const plus = (value: number): BancoCard => ({ id: `p${value}`, kind: "plus", value });
const double: BancoCard = { id: "x2", kind: "double" };
const hand = (...values: (number | BancoCard)[]): BancoCard[] =>
  values.map((value, index) => (typeof value === "number" ? { id: `c${index}`, kind: "number", value } : value));

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

  it("double les nombres avec le ×2, puis ajoute les + et le bonus", () => {
    expect(handTotal(hand(3, 10, double, plus(4)), "stopped")).toBe(30);
    expect(handTotal(hand(0, 1, 2, 3, 4, 5, 6, plus(2)), "playing")).toBe(21 + 2 + 15);
    expect(handTotal(hand(4, 4, double, plus(10)), "busted")).toBe(0);
  });
});

describe("cardLabel", () => {
  it("écrit un nombre, un + ou le ×2", () => {
    expect(hand(7, plus(6), double).map(cardLabel)).toEqual(["7", "+6", "×2"]);
  });
});
