import Game from "@/pages/game/Game";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

const sendMessage = vi.hoisted(() => vi.fn());
const ws = vi.hoisted(() => ({ isConnected: false }));

vi.mock("@/services/apiService", () => ({ api: { get: vi.fn(() => new Promise(() => {})) } }));
vi.mock("@/utils/notify", () => ({ default: vi.fn() }));
vi.mock("@/hooks/useGameEvents", () => ({ useGameEvents: vi.fn() }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE", loading: false }) }));
vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: null, setGame: vi.fn(), sound: false }) }));
vi.mock("@/hooks/WebSocket", () => ({
  useWebSocket: () => ({ isConnected: ws.isConnected, loading: false, sendMessage }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const page = () => (
  <MemoryRouter initialEntries={["/game/g1"]}>
    <Routes>
      <Route path="/game/:gameId" element={<Game />} />
    </Routes>
  </MemoryRouter>
);

describe("page de jeu", () => {
  it("n'annonce l'arrivée du joueur qu'une fois le socket connecté", () => {
    ws.isConnected = false;
    const { rerender } = render(page());
    expect(sendMessage).not.toHaveBeenCalled();

    ws.isConnected = true;
    rerender(page());
    expect(sendMessage).toHaveBeenCalledWith("player-joined-game", { room: "g1" });
  });
});
