import GameCard from "@/components/game/GameCard";
import type { Card, HiddenCard } from "@/types/types";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const game = vi.hoisted(() => ({
  current: {
    id: "g1",
    gameData: { currentStep: "draw", deckCards: [], discardPile: [] },
  } as unknown,
}));

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: game.current }) }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE" }) }));

// La couleur envoyée par le serveur (palette du jeu original) ne doit plus servir à l'affichage
const card = (value: number, revealed: boolean): Card => ({ id: "c1", value, color: "red", revealed, onHand: false });

afterEach(cleanup);

describe("GameCard", () => {
  it("affiche une carte révélée avec sa valeur, son symbole et la tranche tirée de la valeur", () => {
    render(<GameCard card={card(-1, true)} disabled />);
    const face = screen.getByRole("img", { name: "carte -1" });
    expect(face.textContent).toContain("−1");
    expect(face.textContent).toContain("◆");
    expect(face.closest("[data-tier]")?.getAttribute("data-tier")).toBe("neg");
  });

  it("n'affiche pas la valeur d'une carte cachée", () => {
    render(<GameCard card={card(7, false)} disabled />);
    expect(screen.getByRole("img", { name: "carte cachée" })).toBeTruthy();
    expect(screen.queryByText("7")).toBeNull();
  });

  it("affiche le dos d'une carte masquée par le serveur, sans valeur ni couleur", () => {
    const masked: HiddenCard = { id: "c2", revealed: false, onHand: false };
    render(<GameCard card={masked} disabled />);
    expect(screen.getByRole("img", { name: "carte cachée" })).toBeTruthy();
  });

  it("rend une carte jouable cliquable comme un bouton", () => {
    const onClick = vi.fn();
    render(<GameCard card={card(7, false)} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "carte cachée" }));
    expect(onClick).toHaveBeenCalledWith("c1");
  });

  it("ne propose pas de bouton pour une carte désactivée", () => {
    render(<GameCard card={card(7, false)} disabled />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
