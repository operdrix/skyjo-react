import { usePublicGamesUpdates } from "@/hooks/usePublicGamesUpdates";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const handlers = vi.hoisted(() => new Map<string, () => void>());
const sendMessage = vi.hoisted(() => vi.fn());
const unsubscribeFromEvent = vi.hoisted(() => vi.fn());
const connection = vi.hoisted(() => ({ isConnected: true }));

vi.mock("@/hooks/WebSocket", () => ({
  useWebSocket: () => ({
    socket: {},
    isConnected: connection.isConnected,
    sendMessage,
    subscribeToEvent: (event: string, callback: () => void) => handlers.set(event, callback),
    unsubscribeFromEvent,
  }),
}));

beforeEach(() => {
  handlers.clear();
  sendMessage.mockReset().mockResolvedValue({ ok: true });
  unsubscribeFromEvent.mockClear();
  connection.isConnected = true;
});

describe("mises à jour de la liste des parties publiques", () => {
  it("demande au serveur de suivre la liste", () => {
    renderHook(() => usePublicGamesUpdates(vi.fn()));

    expect(sendMessage).toHaveBeenCalledWith("watch-public-games", {});
  });

  it("recharge la liste à chaque changement signalé", async () => {
    const onChange = vi.fn();
    renderHook(() => usePublicGamesUpdates(onChange));
    // Rechargement après l'abonnement : un changement survenu juste avant n'est pas manqué
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    handlers.get("public-games-changed")!();

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("ne fait rien sans connexion", () => {
    connection.isConnected = false;
    renderHook(() => usePublicGamesUpdates(vi.fn()));

    expect(sendMessage).not.toHaveBeenCalled();
    expect(handlers.size).toBe(0);
  });

  it("cesse d'écouter en quittant la page", () => {
    const { unmount } = renderHook(() => usePublicGamesUpdates(vi.fn()));
    const handler = handlers.get("public-games-changed");

    unmount();

    expect(unsubscribeFromEvent).toHaveBeenCalledWith("public-games-changed", handler);
  });
});
