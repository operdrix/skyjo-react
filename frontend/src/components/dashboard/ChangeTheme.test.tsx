import ChangeTheme from "@/components/dashboard/ChangeTheme";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authClient = vi.hoisted(() => ({ updateUser: vi.fn() }));

vi.mock("@/lib/authClient", () => ({ authClient }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("theme-style", "tapis");
  localStorage.setItem("theme-mode", "clair");
  authClient.updateUser.mockResolvedValue({ data: {}, error: null });
});

afterEach(cleanup);

describe("changement de thème", () => {
  it("coche le thème actuel", () => {
    render(<ChangeTheme />);
    expect(screen.getByRole("radio", { name: /tapis de jeu/i }).getAttribute("aria-checked")).toBe("true");
  });

  it("applique le thème choisi et l'enregistre sur le compte", async () => {
    render(<ChangeTheme />);
    fireEvent.click(screen.getByRole("radio", { name: /confettis/i }));

    expect(document.documentElement.dataset.theme).toBe("confettis");
    await waitFor(() => expect(authClient.updateUser).toHaveBeenCalledWith({ theme: "confettis" }));
    expect(screen.getByRole("radio", { name: /confettis/i }).getAttribute("aria-checked")).toBe("true");
  });

  it("revient à l'ancien thème si l'enregistrement échoue", async () => {
    authClient.updateUser.mockResolvedValue({ data: null, error: { message: "boom" } });
    render(<ChangeTheme />);
    fireEvent.click(screen.getByRole("radio", { name: /soirée néon/i }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(document.documentElement.dataset.theme).toBe("tapis");
    expect(localStorage.getItem("theme-style")).toBe("tapis");
    expect(screen.getByRole("radio", { name: /tapis de jeu/i }).getAttribute("aria-checked")).toBe("true");
  });
});
