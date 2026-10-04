import ChangePseudo from "@/components/dashboard/ChangePseudo";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authClient = vi.hoisted(() => ({ updateUser: vi.fn() }));
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/lib/authClient", () => ({ authClient }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userName: "Léa", refresh }) }));

beforeEach(() => {
  vi.clearAllMocks();
  authClient.updateUser.mockResolvedValue({ data: {}, error: null });
});

afterEach(cleanup);

const openForm = () => {
  render(<ChangePseudo />);
  fireEvent.click(screen.getByRole("button", { name: /changer de pseudo/i }));
  return screen.getByLabelText(/nouveau pseudo/i) as HTMLInputElement;
};

describe("changement de pseudo", () => {
  it("pré-remplit le pseudo actuel et enregistre le nouveau", async () => {
    const input = openForm();
    expect(input.value).toBe("Léa");

    fireEvent.change(input, { target: { value: "  Léa la reine " } });
    fireEvent.click(screen.getByRole("button", { name: /enregistrer/i }));

    await waitFor(() => expect(authClient.updateUser).toHaveBeenCalledWith({ username: "Léa la reine" }));
    expect(refresh).toHaveBeenCalled();
    expect(await screen.findByText(/pseudo modifié/i)).toBeTruthy();
  });

  it("affiche l'erreur si le pseudo est déjà pris", async () => {
    authClient.updateUser.mockResolvedValue({ data: null, error: { code: "USERNAME_IS_ALREADY_TAKEN" } });
    const input = openForm();

    fireEvent.change(input, { target: { value: "Marie" } });
    fireEvent.click(screen.getByRole("button", { name: /enregistrer/i }));

    expect(await screen.findByText("Ce pseudo est déjà pris")).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refuse un pseudo invalide sans appeler le serveur", async () => {
    const input = openForm();

    fireEvent.change(input, { target: { value: "<b>" } });
    fireEvent.click(screen.getByRole("button", { name: /enregistrer/i }));

    expect(await screen.findByText(/lettres, chiffres/i)).toBeTruthy();
    expect(authClient.updateUser).not.toHaveBeenCalled();
  });

  it("permet d'annuler", () => {
    openForm();

    fireEvent.click(screen.getByRole("button", { name: /annuler/i }));

    expect(screen.queryByLabelText(/nouveau pseudo/i)).toBeNull();
  });
});
