import { dismissToast, getToasts } from "@/lib/toast";
import WaitingRoom from "@/pages/game/WaitingRoom";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));
const handlers = vi.hoisted(() => new Map<string, (data: unknown) => void>());
const sendMessage = vi.hoisted(() => vi.fn());

vi.mock("@/services/apiService", () => ({ api }));
vi.mock("@/utils/notify", () => ({ default: vi.fn() }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE", loading: false }) }));
vi.mock("@/hooks/WebSocket", () => ({
  useWebSocket: () => ({
    socket: {},
    isConnected: true,
    loading: false,
    sendMessage,
    subscribeToEvent: (event: string, callback: (data: unknown) => void) => handlers.set(event, callback),
    unsubscribeFromEvent: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  getToasts().forEach((t) => dismissToast(t.id));
});

const fullGame = {
  id: "g1",
  state: "pending",
  private: true,
  creator: "BOB",
  maxPlayers: 2,
  players: [
    { id: "BOB", username: "bob" },
    { id: "CARL", username: "carl" },
  ],
  creatorPlayer: { id: "BOB", username: "bob" },
};

describe("salle d'attente", () => {
  it("prévient le joueur quand la partie est pleine et le renvoie à l'accueil", async () => {
    api.get.mockResolvedValue({ data: fullGame });
    render(
      <MemoryRouter initialEntries={["/join/g1"]}>
        <Routes>
          <Route path="/join/:gameId" element={<WaitingRoom />} />
          <Route path="/" element={<p>accueil</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("accueil")).toBeTruthy();
    expect(getToasts()).toMatchObject([{ type: "error", message: "La partie est pleine." }]);
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("ignore le lancement d'une autre partie", async () => {
    const game = { ...fullGame, players: [...fullGame.players, { id: "ALICE", username: "alice" }], maxPlayers: 4 };
    api.get.mockResolvedValue({ data: game });
    render(
      <MemoryRouter initialEntries={["/join/g1"]}>
        <Routes>
          <Route path="/join/:gameId" element={<WaitingRoom />} />
          <Route path="/game/:gameId" element={<p>plateau</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText("bob");

    act(() => handlers.get("start-game")!({ ...game, id: "autre", state: "playing" }));

    expect(screen.queryByText("plateau")).toBeNull();
  });

  it("annonce l'arrivée une seule fois, après l'inscription dans la partie", async () => {
    const openGame = { ...fullGame, maxPlayers: 4 };
    api.get.mockResolvedValue({ data: openGame });
    let joined!: () => void;
    api.patch.mockReturnValue(new Promise((resolve) => (joined = () => resolve({ data: {} }))));
    render(
      <MemoryRouter initialEntries={["/join/g1"]}>
        <Routes>
          <Route path="/join/:gameId" element={<WaitingRoom />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText("bob");
    expect(api.patch).toHaveBeenCalledWith("game/join/g1", {});
    expect(sendMessage).not.toHaveBeenCalledWith("player-joined-game", expect.anything());

    await act(async () => joined());

    expect(sendMessage.mock.calls.filter(([event]) => event === "player-joined-game")).toEqual([
      ["player-joined-game", { room: "g1" }],
    ]);
  });

  it("annonce une seule fois le retour d'un joueur déjà inscrit", async () => {
    const game = { ...fullGame, players: [...fullGame.players, { id: "ALICE", username: "alice" }], maxPlayers: 4 };
    api.get.mockResolvedValue({ data: game });
    render(
      <MemoryRouter initialEntries={["/join/g1"]}>
        <Routes>
          <Route path="/join/:gameId" element={<WaitingRoom />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText("bob");

    expect(api.patch).not.toHaveBeenCalled();
    expect(sendMessage.mock.calls.filter(([event]) => event === "player-joined-game")).toHaveLength(1);
  });
});
