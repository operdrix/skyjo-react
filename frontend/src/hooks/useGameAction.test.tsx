import { useGameAction } from "@/hooks/useGameAction";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const setGame = vi.hoisted(() => vi.fn());
const sendMessage = vi.hoisted(() => vi.fn());
const api = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ setGame }) }));
vi.mock("@/hooks/WebSocket", () => ({ useWebSocket: () => ({ sendMessage }) }));
vi.mock("@/services/apiService", () => ({ api }));

afterEach(() => vi.clearAllMocks());

describe("action de jeu", () => {
  it("n'a rien à resynchroniser quand l'action est acceptée", async () => {
    sendMessage.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useGameAction());

    await act(() => result.current("start-game", { room: "g1" }));

    expect(sendMessage).toHaveBeenCalledWith("start-game", { room: "g1" });
    expect(api.get).not.toHaveBeenCalled();
  });

  it("remet le plateau à l'état du serveur après un refus", async () => {
    sendMessage.mockResolvedValue({ ok: false, message: "Coup refusé" });
    api.get.mockResolvedValue({ data: { id: "g1", state: "playing" } });
    const { result } = renderHook(() => useGameAction());

    await act(() => result.current("initial-turn-card", { room: "g1", cardId: "c1" }));

    expect(api.get).toHaveBeenCalledWith("game/g1");
    expect(setGame).toHaveBeenCalledWith({ id: "g1", state: "playing" });
  });

  it("ne relit pas la partie quand la session a expiré", async () => {
    sendMessage.mockResolvedValue({ ok: false, message: "Session expirée", reason: "session-expired" });
    const { result } = renderHook(() => useGameAction());

    await act(() => result.current("start-game", { room: "g1" }));

    expect(api.get).not.toHaveBeenCalled();
  });
});
