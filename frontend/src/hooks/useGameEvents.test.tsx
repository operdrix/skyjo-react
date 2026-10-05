import { useGameEvents } from "@/hooks/useGameEvents";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("animation de distribution", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reste affichée 3 s après l'annonce, même si la manche arrive tout de suite", () => {
    const onWaitingDeal = vi.fn();
    renderHook(() => useGameEvents("g1", onWaitingDeal, true), { wrapper });

    act(() => handlers.get("waiting-deal")!(undefined));
    act(() => handlers.get("start-game")!({ id: "g1" }));
    expect(setGame).toHaveBeenCalledWith({ id: "g1" });
    expect(onWaitingDeal).toHaveBeenLastCalledWith(true);

    act(() => vi.advanceTimersByTime(2900));
    expect(onWaitingDeal).toHaveBeenLastCalledWith(true);

    act(() => vi.advanceTimersByTime(100));
    expect(onWaitingDeal).toHaveBeenLastCalledWith(false);
  });

  it("s'arrête dès la réception de la manche si l'annonce date de plus de 3 s", () => {
    const onWaitingDeal = vi.fn();
    renderHook(() => useGameEvents("g1", onWaitingDeal, true), { wrapper });

    act(() => handlers.get("waiting-deal")!(undefined));
    act(() => vi.advanceTimersByTime(4000));
    act(() => handlers.get("start-game")!({ id: "g1" }));

    expect(onWaitingDeal).toHaveBeenLastCalledWith(false);
  });

  it("ne reste pas bloquée si les abonnements sont relancés pendant l'animation", () => {
    const onWaitingDeal = vi.fn();
    const { unmount } = renderHook(() => useGameEvents("g1", onWaitingDeal, true), { wrapper });

    act(() => handlers.get("waiting-deal")!(undefined));
    act(() => handlers.get("start-game")!({ id: "g1" }));
    unmount();

    expect(onWaitingDeal).toHaveBeenLastCalledWith(false);
  });
});
