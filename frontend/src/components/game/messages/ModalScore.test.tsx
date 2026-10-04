import ModalScore from "@/components/game/messages/ModalScore";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/Game", () => ({
  useGame: () => ({
    game: {
      roundNumber: 3,
      players: [
        { id: "ALICE", username: "alice", game_players: { score: 30, scoreByRound: [10, 12, 8] } },
        { id: "BOB", username: "bob", game_players: { score: 21, scoreByRound: [5, 9, 7] } },
      ],
    },
  }),
}));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE" }) }));

afterEach(cleanup);

describe("tableau des scores en cours de partie", () => {
  it("détaille les manches jouées et repère le joueur", () => {
    render(<ModalScore />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog.id).toBe("modal-score");
    expect(screen.getByRole("heading", { hidden: true }).textContent).toContain("Manche 3");
    const headers = screen.getAllByRole("columnheader", { hidden: true }).map((h) => h.textContent);
    expect(headers).toEqual(["#", "Joueur", "M1", "M2", "M3", "Total"]);
    expect(screen.getAllByRole("row", { hidden: true })[2].getAttribute("aria-current")).toBe("true");
  });
});
