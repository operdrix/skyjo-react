import GameRules from "@/components/game/GameRules";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

describe("règles du jeu de la partie", () => {
  it("montre les règles de Banco pour une partie de Banco", () => {
    render(<GameRules kind="banco" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Règles de Banco");
  });

  it("explique les cartes action de Banco et la pioche reformée", () => {
    render(<GameRules kind="banco" />);
    const text = document.body.textContent;
    for (const words of ["Gel", "Trois d'un coup", "Seconde chance", "défausse"]) expect(text).toContain(words);
  });

  it("montre les règles de Colonnes sinon", () => {
    render(<GameRules kind="colonnes" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).not.toBe("Règles de Banco");
  });
});
