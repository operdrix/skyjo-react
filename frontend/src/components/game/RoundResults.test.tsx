import RoundResults from "@/components/game/RoundResults";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMessage = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({ game: null as unknown, userId: "BOB", isGuest: false }));

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: state.game, setGame: vi.fn() }) }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: state.userId, isGuest: state.isGuest }) }));
vi.mock("@/hooks/WebSocket", () => ({
  useWebSocket: () => ({ subscribeToEvent: vi.fn(), unsubscribeFromEvent: vi.fn() }),
}));
vi.mock("@/hooks/useGameAction", () => ({ useGameAction: () => sendMessage }));

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
  sendMessage.mockResolvedValue({ ok: true });
  state.userId = "BOB";
  state.isGuest = false;
});
afterEach(cleanup);

describe("invité en fin de partie", () => {
  it("lui propose de créer son compte", () => {
    state.game = makeGame("finished");
    state.isGuest = true;
    renderResults();
    expect(screen.getByRole("link", { name: /créer mon compte/i }).getAttribute("href")).toBe("/auth/register");
  });

  it("ne le propose pas à un joueur avec compte", () => {
    state.game = makeGame("finished");
    renderResults();
    expect(screen.queryByRole("link", { name: /créer mon compte/i })).toBeNull();
  });
});

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

  it("réactive le bouton quand le lancement est refusé", async () => {
    sendMessage.mockResolvedValue({ ok: false, message: "Coup refusé" });
    state.game = makeGame("playing");
    state.userId = "ALICE";
    renderResults();
    const button = screen.getByRole("button", { name: /manche suivante/i }) as HTMLButtonElement;

    fireEvent.click(button);

    await waitFor(() => expect(button.disabled).toBe(false));
  });
});
