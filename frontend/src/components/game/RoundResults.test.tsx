import RoundResults from "@/components/game/RoundResults";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMessage = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({ game: null as unknown, userId: "BOB" }));

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: state.game, setGame: vi.fn() }) }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: state.userId }) }));
vi.mock("@/hooks/WebSocket", () => ({
  useWebSocket: () => ({ sendMessage, subscribeToEvent: vi.fn(), unsubscribeFromEvent: vi.fn() }),
}));

const makeGame = (gameState: "playing" | "finished") => ({
  id: "g1",
  state: gameState,
  creator: "ALICE",
  roundNumber: 2,
  playersPlayAgain: [],
  players: [
    { id: "ALICE", username: "alice", game_players: { score: 10, scoreByRound: [4, 6] } },
    { id: "BOB", username: "bob", game_players: { score: 100, scoreByRound: [40, 60] } },
  ],
  gameData: { currentStep: "endGame", playersCards: {} },
});

const renderResults = () =>
  render(
    <MemoryRouter>
      <RoundResults />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  state.userId = "BOB";
});
afterEach(cleanup);

describe("résultats de manche au centre de la table", () => {
  it("s'affiche dans la page, sans fenêtre qui recouvre les cartes", () => {
    state.game = makeGame("playing");
    renderResults();
    expect(screen.getByRole("region", { name: /fin de la manche 2/i })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("laisse le créateur lancer la manche suivante", () => {
    state.game = makeGame("playing");
    state.userId = "ALICE";
    renderResults();
    fireEvent.click(screen.getByRole("button", { name: /manche suivante/i }));
    expect(sendMessage).toHaveBeenCalledWith("start-game", { room: "g1" });
  });

  it("fait patienter les autres joueurs", () => {
    state.game = makeGame("playing");
    renderResults();
    expect((screen.getByRole("button", { name: /en attente du créateur/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("demande à rejouer avec l'événement attendu par le serveur", () => {
    state.game = makeGame("finished");
    renderResults();
    expect(screen.getByRole("region", { name: /fin de la partie/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /ok pour rejouer/i }));
    expect(sendMessage).toHaveBeenCalledWith("player-play-again", { room: "g1" });
  });
});
