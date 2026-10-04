import Header from "@/components/nav/Header";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/User", () => ({
  useUser: () => ({ isAuthentified: true, loading: false, userName: "alice", logout: vi.fn() }),
}));

afterEach(cleanup);

describe("Header", () => {
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
