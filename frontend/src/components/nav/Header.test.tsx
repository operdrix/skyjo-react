import Header from "@/components/nav/Header";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

const user = vi.hoisted(() => ({ isGuest: false }));
vi.mock("@/hooks/User", () => ({
  useUser: () => ({ isAuthentified: true, isGuest: user.isGuest, loading: false, userName: "alice", logout: vi.fn() }),
}));

afterEach(cleanup);

describe("Header", () => {
  it("propose à un invité de créer son compte, sans espace personnel", () => {
    user.isGuest = true;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Créer mon compte" }).getAttribute("href")).toBe("/auth/register");
    expect(screen.queryByRole("link", { name: "Mon espace" })).toBeNull();
    user.isGuest = false;
  });

  it("mène le joueur connecté à son espace", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Mon espace" }).getAttribute("href")).toBe("/dashboard");
    expect(screen.queryByText(/mon historique/i)).toBeNull();
  });
});
