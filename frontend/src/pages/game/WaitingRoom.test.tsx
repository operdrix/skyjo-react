import { dismissToast, getToasts } from "@/lib/toast";
import WaitingRoom from "@/pages/game/WaitingRoom";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));

vi.mock("@/services/apiService", () => ({ api }));
vi.mock("@/utils/notify", () => ({ default: vi.fn() }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE", loading: false }) }));
vi.mock("@/hooks/WebSocket", () => ({
  useWebSocket: () => ({
    socket: {},
    isConnected: true,
    loading: false,
    sendMessage: vi.fn(),
    subscribeToEvent: vi.fn(),
    unsubscribeFromEvent: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
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
});
