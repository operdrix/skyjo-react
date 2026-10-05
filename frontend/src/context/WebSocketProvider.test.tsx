import { WebSocketProvider } from "@/context/WebSocketProvider";
import { useWebSocket } from "@/hooks/WebSocket";
import { dismissToast, getToasts } from "@/lib/toast";
import { act, cleanup, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

// Faux socket : connecté dès l'appel à connect(), accusé de réception piloté par le test
const fake = vi.hoisted(() => {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const emitWithAck = vi.fn();
  const socket = {
    on: (event: string, callback: (...args: unknown[]) => void) => listeners.set(event, callback),
    off: vi.fn(),
    connect: () => listeners.get("connect")?.(),
    disconnect: vi.fn(),
    // Comme socket.io : emitWithAck s'appuie sur this (perdu si la méthode est extraite de l'objet)
    timeout: () => ({
      emitWithAck(this: { emit?: unknown } | undefined, ...args: unknown[]) {
        if (!this?.emit) throw new TypeError("Cannot read properties of undefined (reading 'emit')");
        return emitWithAck(...args);
      },
      emit: true,
    }),
  };
  return { socket, emitWithAck };
});

vi.mock("socket.io-client", () => ({ io: () => fake.socket }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  getToasts().forEach((t) => dismissToast(t.id));
});

// Hook rendu sur une page de partie, avec la page de connexion à côté
function renderProvider() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={["/game/g1"]}>
      <WebSocketProvider url="http://test">
        <Routes>
          <Route path="/game/:gameId" element={children} />
          <Route path="/auth/login" element={<p>connexion</p>} />
        </Routes>
      </WebSocketProvider>
    </MemoryRouter>
  );
  const { result } = renderHook(() => useWebSocket(), { wrapper });
  return (...args: Parameters<ReturnType<typeof useWebSocket>["sendMessage"]>) => result.current.sendMessage(...args);
}

describe("envoi d'un événement avec accusé de réception", () => {
  it("renvoie l'accusé du serveur sans message quand l'action est acceptée", async () => {
    fake.emitWithAck.mockResolvedValue({ ok: true });
    const send = renderProvider();

    const response = await act(() => send("start-game", { room: "g1" }));

    expect(fake.emitWithAck).toHaveBeenCalledWith("start-game", { room: "g1" });
    expect(response).toEqual({ ok: true });
    expect(getToasts()).toEqual([]);
  });

  it("affiche le motif du refus", async () => {
    fake.emitWithAck.mockResolvedValue({ ok: false, message: "Coup refusé" });
    const send = renderProvider();

    const response = await act(() => send("play-move", { room: "g1", move: "draw" }));

    expect(response).toEqual({ ok: false, message: "Coup refusé" });
    expect(getToasts()).toMatchObject([{ type: "error", message: "Coup refusé" }]);
  });

  it("renvoie vers la connexion quand la session a expiré", async () => {
    fake.emitWithAck.mockResolvedValue({ ok: false, message: "Session expirée", reason: "session-expired" });
    const send = renderProvider();

    await act(() => send("start-game", { room: "g1" }));

    expect(await screen.findByText("connexion")).toBeTruthy();
    expect(getToasts()).toMatchObject([{ message: "Session expirée" }]);
  });

  it("prévient quand le serveur ne répond pas", async () => {
    fake.emitWithAck.mockRejectedValue(new Error("operation has timed out"));
    const send = renderProvider();

    const response = await act(() => send("start-game", { room: "g1" }));

    expect(response).toMatchObject({ ok: false });
    expect(getToasts()).toMatchObject([{ type: "error", message: "Le serveur ne répond pas, réessaie" }]);
  });
});
