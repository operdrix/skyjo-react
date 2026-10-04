import DeleteAccount from "@/components/dashboard/DeleteAccount";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

const authClient = vi.hoisted(() => ({ deleteUser: vi.fn() }));
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/lib/authClient", () => ({ authClient }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ refresh }) }));

function renderDeleteAccount() {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<DeleteAccount />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DeleteAccount", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("demande une confirmation avant de supprimer", () => {
    renderDeleteAccount();

    fireEvent.click(screen.getByRole("button", { name: "Supprimer mon compte" }));

    expect(authClient.deleteUser).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Oui, supprimer définitivement" })).toBeTruthy();
  });

  it("annule sans rien supprimer", () => {
    renderDeleteAccount();

    fireEvent.click(screen.getByRole("button", { name: "Supprimer mon compte" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(authClient.deleteUser).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Oui, supprimer définitivement" })).toBeNull();
  });

  it("supprime le compte puis revient à l'accueil", async () => {
    authClient.deleteUser.mockResolvedValue({ data: { success: true }, error: null });
    renderDeleteAccount();

    fireEvent.click(screen.getByRole("button", { name: "Supprimer mon compte" }));
    fireEvent.click(screen.getByRole("button", { name: "Oui, supprimer définitivement" }));

    await waitFor(() => expect(screen.getByText("Accueil")).toBeTruthy());
    expect(authClient.deleteUser).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalled();
  });

  it("demande de se reconnecter si la connexion date de plus de 24 h", async () => {
    authClient.deleteUser.mockResolvedValue({ data: null, error: { code: "SESSION_EXPIRED", status: 400 } });
    renderDeleteAccount();

    fireEvent.click(screen.getByRole("button", { name: "Supprimer mon compte" }));
    fireEvent.click(screen.getByRole("button", { name: "Oui, supprimer définitivement" }));

    await waitFor(() => expect(screen.getByText(/reconnectez-vous puis réessayez/)).toBeTruthy());
    expect(refresh).not.toHaveBeenCalled();
  });
});
