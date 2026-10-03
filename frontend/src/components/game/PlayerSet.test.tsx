import PlayerSet from "@/components/game/PlayerSet";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const game = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: game.current, sound: false }) }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE" }) }));
vi.mock("@/hooks/WebSocket", () => ({ useWebSocket: () => ({ sendMessage: vi.fn() }) }));

afterEach(cleanup);

describe("PlayerSet", () => {
  it("s'affiche sans planter pour un joueur sans cartes distribuées", () => {
    game.current = {
      id: "g1",
      players: [
        { id: "ALICE", username: "alice" },
        { id: "BOB", username: "bob" },
      ],
      gameData: {
        currentStep: "initialReveal",
        currentPlayer: null,
        playersCards: { ALICE: [] },
        discardPile: [],
        deckCards: [],
      },
    };

    render(<PlayerSet playerId="BOB" />);

    expect(screen.getByText("bob")).toBeTruthy();
  });
});
