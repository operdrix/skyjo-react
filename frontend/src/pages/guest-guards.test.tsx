import App from "@/App";
import { dismissToast, getToasts } from "@/lib/toast";
import Dashboard from "@/pages/dashboard/Dashboard";
import Create from "@/pages/game/Create";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(() => new Promise(() => {})), post: vi.fn() }));

vi.mock("@/services/apiService", () => ({ api }));
vi.mock("@/hooks/User", () => ({
  useUser: () => ({ userId: "LYNX", userName: "Lynx 42", isAuthentified: true, isGuest: true, loading: false }),
}));
vi.mock("@/hooks/WebSocket", () => ({
  useWebSocket: () => ({ socket: {}, isConnected: true, loading: false }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  getToasts().forEach((t) => dismissToast(t.id));
});

const renderAt = (path: string, element: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/auth/register" element={<p>inscription</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("invité : actions réservées aux comptes", () => {
  it("le bouton « Créer une partie » de l'accueil mène à l'inscription", async () => {
    renderAt("/", <App />);

    fireEvent.click(screen.getByRole("button", { name: /créer une partie/i }));

    expect(await screen.findByText("inscription")).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
    expect(getToasts()).toMatchObject([{ message: expect.stringMatching(/compte/) }]);
  });

  it("la page de création mène à l'inscription sans créer de partie", async () => {
    renderAt("/create", <Create />);

    expect(await screen.findByText("inscription")).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("« Mon espace » mène à l'inscription", async () => {
    renderAt("/dashboard", <Dashboard />);

    expect(await screen.findByText("inscription")).toBeTruthy();
    expect(api.get).not.toHaveBeenCalled();
  });
});
