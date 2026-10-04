import PlayingCard from "@/components/PlayingCard";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

describe("PlayingCard", () => {
  afterEach(cleanup);

  it("affiche la valeur, le symbole et la tranche d'une carte visible", () => {
    render(<PlayingCard value={7} />);
    const card = screen.getByRole("img", { name: "carte 7" });
    expect(card.textContent).toContain("7");
    expect(card.textContent).toContain("■");
    expect(card.dataset.tier).toBe("mid");
  });

  it("écrit les valeurs négatives avec un vrai signe moins", () => {
    render(<PlayingCard value={-2} />);
    expect(screen.getByRole("img", { name: "carte -2" }).textContent).toContain("−2");
  });

  it("montre le dos d'une carte cachée", () => {
    render(<PlayingCard />);
    const card = screen.getByRole("img", { name: "carte cachée" });
    expect(card.dataset.tier).toBeUndefined();
  });
});
