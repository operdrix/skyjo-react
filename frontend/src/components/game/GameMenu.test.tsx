import GameMenu from "@/components/game/GameMenu";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

const current = vi.hoisted(() => ({ game: null as unknown }));
vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: current.game }) }));

afterEach(cleanup);

const renderMenu = () =>
  render(
    <MemoryRouter>
      <GameMenu />
    </MemoryRouter>,
  );

describe("menu de la table", () => {
  it("ouvre les règles du jeu de la partie", () => {
    current.game = { gameType: "banco" };
    renderMenu();

    expect(screen.getByRole("heading", { name: "Règles de Banco", hidden: true })).toBeTruthy();
  });

  it("garde les règles de Colonnes pour une partie de Colonnes", () => {
    current.game = { gameType: "colonnes" };
    renderMenu();

    expect(screen.queryByRole("heading", { name: "Règles de Banco", hidden: true })).toBeNull();
  });
});
