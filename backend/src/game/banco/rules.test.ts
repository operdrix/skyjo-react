import { describe, expect, it } from "vitest";
import type { BancoCard, BancoData } from "../../../../shared/types.ts";
import { createDeck, deal, hit, leave, renamePlayer, result, roundScores, stay, view } from "./rules.ts";

const card = (value: number, id = `c${value}-${Math.random()}`): BancoCard => ({ id, value });

// Manche à partir des seuls champs utiles au test ; la pioche se lit dans l'ordre (la première carte sort d'abord)
function round(partial: Partial<BancoData> & { deckValues?: number[] }): BancoData {
  const { deckValues = [], ...rest } = partial;
  const turnOrder = rest.turnOrder ?? ["a", "b"];
  return {
    deck: deckValues.map((value) => card(value)),
    hands: Object.fromEntries(turnOrder.map((id) => [id, []])),
    status: Object.fromEntries(turnOrder.map((id) => [id, "playing"])),
    turnOrder,
    currentPlayer: turnOrder[0],
    lastDraw: null,
    roundOver: false,
    ...rest,
  };
}

const hand = (...values: number[]) => values.map((value) => card(value));

describe("createDeck", () => {
  it("contient les nombres de 0 à 12, n exemplaires de n et un seul 0", () => {
    const values = createDeck().map((c) => c.value);

    expect(values).toHaveLength(79);
    expect(values.filter((v) => v === 0)).toHaveLength(1);
    expect(values.filter((v) => v === 1)).toHaveLength(1);
    expect(values.filter((v) => v === 12)).toHaveLength(12);
  });

  it("tire des ids au hasard, sans lien avec la valeur", () => {
    const ids = createDeck().map((c) => c.id);

    expect(new Set(ids).size).toBe(79);
    expect(ids.some((id) => /\d+$/.test(id) && id.includes("card"))).toBe(false);
  });
});

describe("deal", () => {
  it("donne une carte à chaque joueur, tous en jeu, le premier joueur commence", () => {
    const state = deal(["a", "b", "c"], 1);

    expect(state.turnOrder).toEqual(["a", "b", "c"]);
    expect(state.currentPlayer).toBe("a");
    expect(Object.values(state.hands).map((h) => h.length)).toEqual([1, 1, 1]);
    expect(Object.values(state.status)).toEqual(["playing", "playing", "playing"]);
    expect(state.deck).toHaveLength(79 - 3);
    expect(state.roundOver).toBe(false);
  });

  it("fait tourner le premier joueur à chaque manche", () => {
    expect(deal(["a", "b", "c"], 2).currentPlayer).toBe("b");
    expect(deal(["a", "b", "c"], 4).currentPlayer).toBe("a");
  });
});

describe("hit (Encore)", () => {
  it("donne la carte du dessus au joueur et passe au joueur suivant", () => {
    const state = round({ hands: { a: hand(3), b: hand(5) }, deckValues: [7, 9] });

    const next = hit(state, "a")!;

    expect(next.hands.a.map((c) => c.value)).toEqual([3, 7]);
    expect(next.deck).toHaveLength(1);
    expect(next.lastDraw).toMatchObject({ playerId: "a", card: { value: 7 } });
    expect(next.currentPlayer).toBe("b");
    expect(state.hands.a).toHaveLength(1);
  });

  it("refuse si ce n'est pas le tour du joueur ou s'il n'est plus en jeu", () => {
    const state = round({ hands: { a: hand(3), b: hand(5) }, deckValues: [7] });

    expect(hit(state, "b")).toBeNull();
    expect(hit({ ...state, status: { a: "stopped", b: "playing" } }, "a")).toBeNull();
    expect(hit({ ...state, roundOver: true }, "a")).toBeNull();
  });

  it("élimine le joueur qui tire un nombre qu'il a déjà", () => {
    const state = round({ hands: { a: hand(3), b: hand(5) }, deckValues: [3] });

    const next = hit(state, "a")!;

    expect(next.status.a).toBe("busted");
    expect(next.hands.a.map((c) => c.value)).toEqual([3, 3]);
    expect(next.currentPlayer).toBe("b");
  });

  it("termine la manche dès qu'un joueur réunit 7 nombres différents", () => {
    const state = round({ hands: { a: hand(1, 2, 3, 4, 5, 6), b: hand(9) }, deckValues: [7] });

    const next = hit(state, "a")!;

    expect(next.roundOver).toBe(true);
    expect(next.currentPlayer).toBeNull();
  });

  it("passe les joueurs arrêtés ou éliminés", () => {
    const state = round({
      turnOrder: ["a", "b", "c"],
      hands: { a: hand(1), b: hand(2), c: hand(4) },
      status: { a: "playing", b: "stopped", c: "playing" },
      deckValues: [8],
    });

    expect(hit(state, "a")!.currentPlayer).toBe("c");
  });

  it("rejoue le même joueur s'il est le seul encore en jeu", () => {
    const state = round({
      hands: { a: hand(1), b: hand(2) },
      status: { a: "playing", b: "stopped" },
      deckValues: [8],
    });

    expect(hit(state, "a")!.currentPlayer).toBe("a");
  });
});

describe("stay (Stop)", () => {
  it("arrête le joueur et passe au suivant", () => {
    const state = round({ hands: { a: hand(3), b: hand(5) } });

    const next = stay(state, "a")!;

    expect(next.status.a).toBe("stopped");
    expect(next.currentPlayer).toBe("b");
  });

  it("refuse hors de son tour", () => {
    expect(stay(round({}), "b")).toBeNull();
  });

  it("termine la manche quand plus personne n'est en jeu", () => {
    const state = round({
      hands: { a: hand(3), b: hand(5) },
      status: { a: "busted", b: "playing" },
      currentPlayer: "b",
    });

    const next = stay(state, "b")!;

    expect(next.roundOver).toBe(true);
    expect(next.currentPlayer).toBeNull();
  });
});

describe("leave", () => {
  it("arrête un joueur parti, en gardant ses points, et passe son tour", () => {
    const state = round({ hands: { a: hand(3), b: hand(5) } });

    const next = leave(state, "a");

    expect(next.status.a).toBe("stopped");
    expect(next.currentPlayer).toBe("b");
  });

  it("ne change rien pour un joueur déjà arrêté", () => {
    const state = round({ status: { a: "playing", b: "busted" } });

    expect(leave(state, "b")).toEqual(state);
  });
});

describe("roundScores", () => {
  it("additionne les nombres, 0 en cas de doublon, +15 pour 7 nombres différents", () => {
    const state = round({
      turnOrder: ["a", "b", "c"],
      hands: { a: hand(3, 10), b: hand(4, 4), c: hand(0, 1, 2, 3, 4, 5, 6) },
      status: { a: "stopped", b: "busted", c: "playing" },
      roundOver: true,
    });

    expect(roundScores(state)).toEqual({ a: 13, b: 0, c: 21 + 15 });
  });
});

describe("result", () => {
  it("termine la partie dès 200 points, le plus haut total gagne", () => {
    expect(result({ a: 150, b: 205, c: 210 })).toEqual({ finished: true, winner: "c", winnerScore: 210 });
    expect(result({ a: 150, b: 199 }).finished).toBe(false);
  });
});

describe("view", () => {
  it("ne montre que le nombre de cartes de la pioche", () => {
    const shown = view(round({ deckValues: [7, 8, 9] }));

    expect(shown).not.toHaveProperty("deck");
    expect(shown.deckCount).toBe(3);
    expect(JSON.stringify(shown)).not.toContain('"value":7');
  });
});

describe("renamePlayer", () => {
  it("remplace l'identifiant d'un joueur partout", () => {
    const state = round({ hands: { a: hand(3), b: hand(5) }, lastDraw: { playerId: "a", card: card(3) } });

    const renamed = renamePlayer(state, "a", "z");

    expect(renamed.turnOrder).toEqual(["z", "b"]);
    expect(renamed.currentPlayer).toBe("z");
    expect(Object.keys(renamed.hands)).toEqual(["z", "b"]);
    expect(renamed.status.z).toBe("playing");
    expect(renamed.lastDraw?.playerId).toBe("z");
  });
});
