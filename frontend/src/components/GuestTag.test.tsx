import GameHistoryCard from "@/components/dashboard/GameHistoryCard";
import ScoreTable from "@/components/game/ScoreTable";
import PlayerList from "@/components/waiting-room/PlayerList";
import type { GameType } from "@/types/types";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

const players = [
  { id: "ALICE", username: "alice", isAnonymous: false, game_players: { score: 8, scoreByRound: [8] } },
  { id: "LYNX", username: "Lynx 42", isAnonymous: true, game_players: { score: 20, scoreByRound: [20] } },
];
const game = {
  id: "g1",
  state: "finished",
  creator: "ALICE",
  winner: "ALICE",
  roundNumber: 1,
  maxPlayers: 4,
  createdAt: "2026-10-04T10:00:00Z",
  creatorPlayer: players[0],
  players,
} as unknown as GameType;

// Une seule mention « invité », à côté du pseudo de l'invité
const expectGuestTagOnLynxOnly = () => {
  expect(screen.getAllByText("invité")).toHaveLength(1);
  expect(screen.getByText("invité").parentElement?.closest("li, tr, span, p")?.textContent).toContain("Lynx 42");
};

describe("mention « invité » à côté du pseudo d'un invité", () => {
  it("en salle d'attente", () => {
    render(<PlayerList game={game} />);
    expectGuestTagOnLynxOnly();
  });

  it("dans les résultats", () => {
    render(<ScoreTable players={players} userId="ALICE" />);
    expectGuestTagOnLynxOnly();
  });

  it("dans l'historique", () => {
    render(
      <MemoryRouter>
        <GameHistoryCard game={game} userId="ALICE" onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expectGuestTagOnLynxOnly();
  });
});
