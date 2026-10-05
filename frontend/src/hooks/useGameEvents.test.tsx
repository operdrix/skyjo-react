import { useGameEvents } from "@/hooks/useGameEvents";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setGame = vi.hoisted(() => vi.fn());
const handlers = vi.hoisted(() => new Map<string, (data: unknown) => void>());

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ setGame }) }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE" }) }));
vi.mock("@/hooks/WebSocket", () => ({
  useWebSocket: () => ({
    socket: {},
    isConnected: true,
    subscribeToEvent: (event: string, callback: (data: unknown) => void) => handlers.set(event, callback),
    unsubscribeFromEvent: vi.fn(),
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

beforeEach(() => {
  setGame.mockClear();
  handlers.clear();
});

describe("événements de la partie en cours", () => {
  it.each(["player-joined-game", "player-left-game", "update-game-params", "play-move", "start-game"])(
    "ignore « %s » d'une autre partie",
    (event) => {
      renderHook(() => useGameEvents("g1", vi.fn(), true), { wrapper });

      handlers.get(event)!({ id: "autre" });

      expect(setGame).not.toHaveBeenCalled();
    },
  );

  it("applique les mises à jour de la partie affichée", () => {
    renderHook(() => useGameEvents("g1", vi.fn(), true), { wrapper });

    handlers.get("play-move")!({ id: "g1" });

    expect(setGame).toHaveBeenCalledWith({ id: "g1" });
  });
});
