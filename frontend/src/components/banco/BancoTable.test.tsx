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

const ACTIONS = ["freeze", "three", "second"];
const hand = (...values: (number | string)[]) =>
  values.map((value, index) =>
    value === "×2"
      ? { id: `x2-${index}`, kind: "double" }
      : typeof value === "string" && ACTIONS.includes(value)
        ? { id: `${value}-${index}`, kind: value }
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
      { id: "CAROL", username: "carol", game_players: { score: 0, scoreByRound: [0] } },
    ],
    gameData: {
      turnOrder: ["ALICE", "BOB"],
      currentPlayer: "ALICE",
      hands: { ALICE: hand(3, 10), BOB: hand(4, 4) },
      status: { ALICE: "playing", BOB: "busted" },
      pending: [],
      lastDraw: null,
      lastAction: null,
      roundOver: false,
      deckCount: 70,
      discardCount: 0,
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

  it("montre la Seconde chance d'un joueur", () => {
    state.game = makeGame({ hands: { ALICE: hand(3, "second"), BOB: hand(4, 4) } });
    render(<BancoTable />);

    const actions = within(panel("alice")).getByRole("list", { name: "Actions" });
    expect(within(actions).getByRole("img", { name: "Seconde chance" })).toBeTruthy();
  });

  it("me fait choisir la cible d'une action, parmi les joueurs possibles, à la place d'Encore et Stop", () => {
    state.game = makeGame({
      turnOrder: ["ALICE", "BOB", "CAROL"],
      currentPlayer: "BOB",
      hands: { ALICE: hand(3), BOB: hand(5), CAROL: hand(6) },
      status: { ALICE: "playing", BOB: "playing", CAROL: "stopped" },
      pending: [{ playerId: "ALICE", card: { id: "g", kind: "freeze" } }],
    });
    render(<BancoTable />);

    expect(screen.getByRole("status").textContent).toContain("Choisis qui reçoit Gel");
    expect(screen.queryByRole("button", { name: "Encore" })).toBeNull();
    const choice = within(screen.getByRole("group", { name: "Cible de Gel" }));
    expect(choice.getAllByRole("button").map((button) => button.textContent)).toEqual(["alice (toi)", "bob"]);

    fireEvent.click(choice.getByRole("button", { name: "bob" }));

    expect(state.sendMessage.mock.calls).toEqual([["play-move", { room: "g1", move: "target", target: "BOB" }]]);
  });

  it("indique qui choisit une cible quand ce n'est pas moi", () => {
    state.game = makeGame({
      currentPlayer: "ALICE",
      status: { ALICE: "playing", BOB: "playing" },
      pending: [{ playerId: "BOB", card: { id: "t", kind: "three" } }],
    });
    render(<BancoTable />);

    expect(screen.getByRole("status").textContent).toContain("bob choisit qui reçoit Trois d'un coup");
    expect(screen.getByRole("button", { name: "Encore" }).hasAttribute("disabled")).toBe(true);
  });

  it("annonce l'action attribuée et la Seconde chance utilisée", () => {
    state.game = makeGame({
      lastAction: { playerId: "BOB", card: { id: "g", kind: "freeze" }, target: "ALICE" },
      lastDraw: { playerId: "BOB", card: { id: "x", kind: "number", value: 4 }, saved: true },
      status: { ALICE: "playing", BOB: "playing" },
    });
    render(<BancoTable />);

    const text = screen.getByRole("status").textContent;
    expect(text).toContain("bob a tiré un 4 : Seconde chance utilisée !");
    expect(text).toContain("bob donne Gel à alice");
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
