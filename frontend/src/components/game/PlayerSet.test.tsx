import PlayerSet from "@/components/game/PlayerSet";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const game = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: game.current, sound: false }) }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE" }) }));
vi.mock("@/hooks/useGameAction", () => ({ useGameAction: () => vi.fn() }));

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

  it("signale un adversaire invité à la table", () => {
    game.current = {
      id: "g1",
      players: [
        { id: "ALICE", username: "alice", isAnonymous: false },
        { id: "LYNX", username: "Lynx 42", isAnonymous: true },
      ],
      gameData: {
        currentStep: "initialReveal",
        currentPlayer: null,
        playersCards: { ALICE: [], LYNX: [] },
        discardPile: [],
        deckCards: [],
      },
    };

    render(<PlayerSet playerId="LYNX" />);

    expect(screen.getByRole("group", { name: /Lynx 42/ }).textContent).toContain("invité");
  });

  it("affiche les points de la manche à côté du nom en fin de manche", () => {
    game.current = {
      id: "g1",
      players: [
        { id: "ALICE", username: "alice", game_players: { score: 30, scoreByRound: [18, 12] } },
        { id: "BOB", username: "bob", game_players: { score: 10, scoreByRound: [12, -2] } },
      ],
      gameData: {
        currentStep: "endGame",
        currentPlayer: null,
        playersCards: { ALICE: [], BOB: [] },
        discardPile: [],
        deckCards: [],
      },
    };

    render(<PlayerSet playerId="BOB" />);

    expect(screen.getByLabelText("−2 points cette manche")).toBeTruthy();
  });

  it("titre ton propre jeu « Toi » avec la manche et ton total", () => {
    game.current = {
      id: "g1",
      roundNumber: 2,
      players: [
        { id: "ALICE", username: "alice", game_players: { score: 23, scoreByRound: [23] } },
        { id: "BOB", username: "bob", game_players: { score: 10, scoreByRound: [10] } },
      ],
      gameData: {
        currentStep: "draw",
        currentPlayer: "BOB",
        playersCards: { ALICE: [] },
        discardPile: [],
        deckCards: [],
      },
    };

    render(<PlayerSet playerId="ALICE" isCurrentPlayerSet />);

    expect(screen.getByRole("heading", { name: /toi/i })).toBeTruthy();
    expect(screen.getByText("Manche 2 · 23 pts")).toBeTruthy();
    expect(screen.queryByText("alice")).toBeNull();
  });

  it("présente un adversaire dans son cadre avec son nom et son total", () => {
    game.current = {
      id: "g1",
      roundNumber: 2,
      players: [
        { id: "ALICE", username: "alice", game_players: { score: 23, scoreByRound: [23] } },
        { id: "BOB", username: "bob", game_players: { score: 14, scoreByRound: [14] } },
      ],
      gameData: {
        currentStep: "draw",
        currentPlayer: "BOB",
        playersCards: { BOB: [] },
        discardPile: [],
        deckCards: [],
      },
    };

    render(<PlayerSet playerId="BOB" smallSet />);

    const panel = screen.getByRole("group", { name: "bob" });
    expect(panel.textContent).toContain("14");
    expect(panel.className).toContain("player-turn");
  });
});
