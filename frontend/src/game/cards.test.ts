import { describe, expect, it } from "vitest";
import { cardTier } from "@/game/cards";

describe("cardTier", () => {
  it.each([
    [-2, "neg", "◆"],
    [-1, "neg", "◆"],
    [0, "zero", "●"],
    [1, "low", "▲"],
    [4, "low", "▲"],
    [5, "mid", "■"],
    [8, "mid", "■"],
    [9, "high", "✱"],
    [12, "high", "✱"],
  ])("classe la carte %i dans la tranche %s", (value, tier, symbol) => {
    expect(cardTier(value)).toEqual({ tier, symbol });
  });
});
