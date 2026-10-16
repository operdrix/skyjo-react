import ModalScore from "@/components/game/messages/ModalScore";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const kind = vi.hoisted(() => ({ gameType: "colonnes" }));

vi.mock("@/hooks/Game", () => ({
  useGame: () => ({
    game: {
      gameType: kind.gameType,
      roundNumber: 3,
      players: [
        { id: "ALICE", username: "alice", game_players: { score: 30, scoreByRound: [10, 12, 8] } },
        { id: "BOB", username: "bob", game_players: { score: 21, scoreByRound: [5, 9, 7] } },
      ],
    },
  }),
}));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE" }) }));

afterEach(() => {
  kind.gameType = "colonnes";
  cleanup();
});

describe("tableau des scores en cours de partie", () => {
  it("détaille les manches jouées et repère le joueur", () => {
    render(<ModalScore />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog.id).toBe("modal-score");
    expect(screen.getByRole("heading", { hidden: true }).textContent).toContain("Manche 3");
    const headers = screen.getAllByRole("columnheader", { hidden: true }).map((h) => h.textContent);
    expect(headers).toEqual(["#", "Joueur", "M1", "M2", "M3", "Total"]);
    expect(screen.getAllByRole("row", { hidden: true })[2].getAttribute("aria-current")).toBe("true");
    expect(dialog.textContent).toContain("Le plus petit total gagne. La partie s'arrête quand un joueur atteint 100.");
  });

  it("Banco : le plus haut total gagne, partie en 200", () => {
    kind.gameType = "banco";
    render(<ModalScore />);
    const dialog = screen.getByRole("dialog", { hidden: true });

    expect(screen.getAllByRole("row", { hidden: true })[1].textContent).toContain("alice");
    expect(dialog.textContent).toContain("Le plus haut total gagne. La partie s'arrête quand un joueur atteint 200.");
  });
});
