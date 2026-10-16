import BancoTable from "@/components/banco/BancoTable";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ game: null as unknown, sendMessage: vi.fn() }));

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: state.game, setGame: vi.fn(), sound: false }) }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE" }) }));
vi.mock("@/hooks/useGameAction", () => ({ useGameAction: () => state.sendMessage }));
vi.mock("@/components/game/RoundResults", () => ({ default: () => <p>Résultats de la manche</p> }));
vi.mock("@/components/game/GameMenu", () => ({ default: () => null }));
vi.mock("@/components/game/GameSettings", () => ({ default: () => null }));
vi.mock("@/components/game/messages/ModalScore", () => ({ default: () => null }));

const hand = (...values: (number | string)[]) =>
  values.map((value, index) =>
    value === "×2"
      ? { id: `x2-${index}`, kind: "double" }
      : typeof value === "string"
        ? { id: `p${value}-${index}`, kind: "plus", value: Number(value) }
        : { id: `c${value}-${index}`, kind: "number", value },
  );

function makeGame(gameData: object = {}) {
  return {
    id: "g1",
    gameType: "banco",
    players: [
      { id: "ALICE", username: "alice", game_players: { score: 40, scoreByRound: [40] } },
      { id: "BOB", username: "bob", isAnonymous: true, game_players: { score: 12, scoreByRound: [12] } },
    ],
    gameData: {
      turnOrder: ["ALICE", "BOB"],
      currentPlayer: "ALICE",
      hands: { ALICE: hand(3, 10), BOB: hand(4, 4) },
      status: { ALICE: "playing", BOB: "busted" },
      lastDraw: null,
      roundOver: false,
      deckCount: 70,
      ...gameData,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.sendMessage.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

const panel = (name: string) => screen.getByRole("region", { name: new RegExp(`^${name}`) });

describe("table de Banco", () => {
  it("montre les cartes, le total provisoire, le total de partie et l'état de chaque joueur", () => {
    state.game = makeGame();
    render(<BancoTable />);

    const alice = within(panel("alice"));
    expect(alice.getByLabelText("carte 3")).toBeTruthy();
    expect(alice.getByLabelText("carte 10")).toBeTruthy();
    expect(alice.getByText("En jeu")).toBeTruthy();
    expect(alice.getByText("13 pts")).toBeTruthy();
    expect(alice.getByText(/Total 40/)).toBeTruthy();

    const bob = within(panel("bob"));
    expect(bob.getByText("Éliminé")).toBeTruthy();
    expect(bob.getByText("0 pts")).toBeTruthy();
    expect(bob.getByText("invité")).toBeTruthy();
  });

  it("montre les modificateurs à part des nombres et les compte dans le total provisoire", () => {
    state.game = makeGame({ hands: { ALICE: hand(3, "×2", 10, "+4"), BOB: hand(4, 4) } });
    render(<BancoTable />);

    const alice = within(panel("alice"));
    const numbers = alice.getByRole("list", { name: "Nombres" });
    const modifiers = alice.getByRole("list", { name: "Modificateurs" });
    expect(
      within(numbers)
        .getAllByRole("img")
        .map((card) => card.getAttribute("aria-label")),
    ).toEqual(["carte 3", "carte 10"]);
    expect(
      within(modifiers)
        .getAllByRole("img")
        .map((card) => card.getAttribute("aria-label")),
    ).toEqual(["modificateur ×2", "modificateur +4"]);
    expect(alice.getByText("30 pts")).toBeTruthy();
  });

  it("annonce un modificateur tiré", () => {
    state.game = makeGame({ lastDraw: { playerId: "BOB", card: { id: "x", kind: "plus", value: 8 } } });
    render(<BancoTable />);

    expect(screen.getByRole("status").textContent).toContain("bob a tiré un +8");
  });

  it.each([
    ["Encore", "hit"],
    ["Stop", "stay"],
  ])("envoie « %s » au serveur quand c'est mon tour", (label, move) => {
    state.game = makeGame();
    render(<BancoTable />);

    fireEvent.click(screen.getByRole("button", { name: label }));

    expect(state.sendMessage.mock.calls).toEqual([["play-move", { room: "g1", move }]]);
  });

  it("n'envoie qu'un coup à la fois", () => {
    state.game = makeGame();
    state.sendMessage.mockReturnValue(new Promise(() => {}));
    render(<BancoTable />);

    fireEvent.click(screen.getByRole("button", { name: "Encore" }));
    fireEvent.click(screen.getByRole("button", { name: "Encore" }));

    expect(state.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("désactive Encore et Stop quand ce n'est pas mon tour", () => {
    state.game = makeGame({ currentPlayer: "BOB", status: { ALICE: "stopped", BOB: "playing" } });
    render(<BancoTable />);

    expect(screen.getByRole("button", { name: "Encore" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Stop" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("bob joue");
  });

  it("annonce le dernier tirage, et l'élimination sur un doublon", () => {
    state.game = makeGame({ lastDraw: { playerId: "BOB", card: { id: "x", kind: "number", value: 4 } } });
    render(<BancoTable />);

    expect(screen.getByRole("status").textContent).toContain("bob a tiré un 4 : éliminé !");
  });

  it("affiche les résultats au centre en fin de manche, sans boutons de jeu", () => {
    state.game = makeGame({ roundOver: true, currentPlayer: null });
    render(<BancoTable />);

    expect(screen.getByText("Résultats de la manche")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Encore" })).toBeNull();
  });
});
