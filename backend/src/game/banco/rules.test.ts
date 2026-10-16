import { describe, expect, it } from "vitest";
import type { BancoCard, BancoData } from "../../../../shared/types.ts";
import { chooseTarget, createDeck, deal, hit, leave, renamePlayer, result, roundScores, stay, view } from "./rules.ts";

const card = (value: number, id = `c${value}-${Math.random()}`): BancoCard => ({ id, kind: "number", value });
const plus = (value: number): BancoCard => ({ id: `p${value}-${Math.random()}`, kind: "plus", value });
const double = (): BancoCard => ({ id: `x2-${Math.random()}`, kind: "double" });
const freeze = (): BancoCard => ({ id: `gel-${Math.random()}`, kind: "freeze" });
const three = (): BancoCard => ({ id: `trois-${Math.random()}`, kind: "three" });
const second = (): BancoCard => ({ id: `sc-${Math.random()}`, kind: "second" });
const values = (cards: BancoCard[]) => cards.map((c) => (c.kind === "number" || c.kind === "plus" ? c.value : c.kind));

// Manche à partir des seuls champs utiles au test ; la pioche se lit dans l'ordre (la première carte sort d'abord)
function round(partial: Partial<BancoData> & { deckValues?: (number | BancoCard)[] }): BancoData {
  const { deckValues = [], ...rest } = partial;
  const turnOrder = rest.turnOrder ?? ["a", "b"];
  return {
    deck: deckValues.map((value) => (typeof value === "number" ? card(value) : value)),
    hands: Object.fromEntries(turnOrder.map((id) => [id, []])),
    status: Object.fromEntries(turnOrder.map((id) => [id, "playing"])),
    turnOrder,
    currentPlayer: turnOrder[0],
    discard: [],
    pending: [],
    lastDraw: null,
    lastAction: null,
    roundOver: false,
    ...rest,
  };
}

const hand = (...values: (number | BancoCard)[]) =>
  values.map((value) => (typeof value === "number" ? card(value) : value));

describe("createDeck", () => {
  it("contient les nombres de 0 à 12, n exemplaires de n et un seul 0", () => {
    const values = createDeck().flatMap((c) => (c.kind === "number" ? [c.value] : []));

    expect(values).toHaveLength(79);
    expect(values.filter((v) => v === 0)).toHaveLength(1);
    expect(values.filter((v) => v === 1)).toHaveLength(1);
    expect(values.filter((v) => v === 12)).toHaveLength(12);
  });

  it("contient les modificateurs +2, +4, +6, +8, +10 et ×2, un exemplaire de chaque", () => {
    const modifiers = createDeck().flatMap((c) =>
      c.kind === "plus" ? [`+${c.value}`] : c.kind === "double" ? ["×2"] : [],
    );

    expect(modifiers.sort()).toEqual(["+10", "+2", "+4", "+6", "+8", "×2"]);
  });

  it("contient 3 Gel, 3 Trois d'un coup et 3 Seconde chance", () => {
    const actions = createDeck().filter((c) => ["freeze", "three", "second"].includes(c.kind));

    expect(values(actions).sort()).toEqual([
      "freeze",
      "freeze",
      "freeze",
      "second",
      "second",
      "second",
      "three",
      "three",
      "three",
    ]);
  });

  it("tire des ids au hasard, sans lien avec la valeur", () => {
    const ids = createDeck().map((c) => c.id);

    expect(new Set(ids).size).toBe(94);
    expect(ids.some((id) => /\d+$/.test(id) && id.includes("card"))).toBe(false);
  });
});

describe("deal", () => {
  it("donne une carte à chaque joueur, tous en jeu, le premier joueur commence", () => {
    const previous = round({ turnOrder: ["a", "b", "c"], deckValues: [1, 2, 3, 4], roundOver: true });

    const state = deal(["a", "b", "c"], 1, previous);

    expect(state.turnOrder).toEqual(["a", "b", "c"]);
    expect(state.currentPlayer).toBe("a");
    expect(Object.values(state.hands).map(values)).toEqual([[1], [2], [3]]);
    expect(Object.values(state.status)).toEqual(["playing", "playing", "playing"]);
    expect(values(state.deck)).toEqual([4]);
    expect(state.roundOver).toBe(false);
  });

  it("commence une partie avec le paquet complet mélangé", () => {
    const state = deal(["a", "b", "c"], 1);
    const cards = [
      ...state.deck,
      ...state.discard,
      ...Object.values(state.hands).flat(),
      ...state.pending.map((p) => p.card),
    ];

    expect(cards).toHaveLength(94);
  });

  it("continue la pioche de la manche précédente et défausse les cartes jouées", () => {
    const previous = round({
      hands: { a: hand(3, plus(4)), b: hand(5) },
      discard: hand(9),
      deckValues: [1, 2, 7, 8],
      roundOver: true,
    });

    const state = deal(["a", "b"], 2, previous);

    expect(values(state.deck)).toEqual([7, 8]);
    expect(values(state.discard).sort()).toEqual([3, 4, 5, 9]);
    expect(state.pending).toEqual([]);
  });

  it("fait choisir une cible au joueur qui reçoit une action à la distribution", () => {
    const previous = round({ deckValues: [freeze(), 2, 7], roundOver: true });

    const state = deal(["a", "b"], 1, previous);

    expect(state.pending.map((p) => [p.playerId, p.card.kind])).toEqual([["a", "freeze"]]);
    expect(state.currentPlayer).toBe("a");
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

    expect(next.hands.a.map((c) => c.kind === "number" && c.value)).toEqual([3, 7]);
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
    expect(next.hands.a).toHaveLength(2);
    expect(next.currentPlayer).toBe("b");
  });

  it("termine la manche dès qu'un joueur réunit 7 nombres différents", () => {
    const state = round({ hands: { a: hand(1, 2, 3, 4, 5, 6), b: hand(9) }, deckValues: [7] });

    const next = hit(state, "a")!;

    expect(next.roundOver).toBe(true);
    expect(next.currentPlayer).toBeNull();
  });

  it("pose un modificateur devant le joueur sans l'éliminer, même s'il en a déjà un", () => {
    const state = round({ hands: { a: hand(3, plus(4)), b: hand(5) }, deckValues: [double()] });

    const next = hit(state, "a")!;

    expect(next.status.a).toBe("playing");
    expect(next.hands.a.map((c) => c.kind)).toEqual(["number", "plus", "double"]);
    expect(next.currentPlayer).toBe("b");
  });

  it("ne compte pas les modificateurs dans les 7 nombres différents", () => {
    const state = round({ hands: { a: hand(1, 2, 3, 4, 5, plus(2)), b: hand(9) }, deckValues: [double()] });

    expect(hit(state, "a")!.roundOver).toBe(false);
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

describe("actions", () => {
  it("Gel : le joueur qui le tire choisit une cible ; en attendant, personne ne joue", () => {
    const state = round({ hands: { a: hand(3), b: hand(5) }, deckValues: [freeze()] });

    const next = hit(state, "a")!;

    expect(next.pending.map((p) => [p.playerId, p.card.kind])).toEqual([["a", "freeze"]]);
    expect(hit(next, "b")).toBeNull();
    expect(stay(next, "b")).toBeNull();
  });

  it("Gel : arrête la cible, qui garde ses points, et le tour continue", () => {
    const state = hit(
      round({ turnOrder: ["a", "b", "c"], hands: { a: hand(3), b: hand(5), c: hand(6) }, deckValues: [freeze()] }),
      "a",
    )!;

    const next = chooseTarget(state, "a", "b")!;

    expect(next.status.b).toBe("stopped");
    expect(values(next.hands.b)).toEqual([5, "freeze"]);
    expect(next.pending).toEqual([]);
    expect(next.lastAction).toMatchObject({ playerId: "a", target: "b", card: { kind: "freeze" } });
    expect(next.currentPlayer).toBe("c");
    expect(roundScores({ ...next, roundOver: true }).b).toBe(5);
  });

  it("refuse une cible hors jeu, inconnue, ou un choix fait par un autre joueur", () => {
    const state = hit(
      round({
        turnOrder: ["a", "b", "c"],
        hands: { a: hand(3), b: hand(5), c: hand(6) },
        status: { a: "playing", b: "playing", c: "stopped" },
        deckValues: [freeze()],
      }),
      "a",
    )!;

    expect(chooseTarget(state, "a", "c")).toBeNull();
    expect(chooseTarget(state, "a", "z")).toBeNull();
    expect(chooseTarget(state, "b", "a")).toBeNull();
    expect(chooseTarget(round({}), "a", "b")).toBeNull();
  });

  it("le joueur peut se cibler lui-même", () => {
    const state = hit(round({ hands: { a: hand(3), b: hand(5) }, deckValues: [freeze()] }), "a")!;

    expect(chooseTarget(state, "a", "a")!.status.a).toBe("stopped");
  });

  it("s'applique d'office au joueur seul en jeu", () => {
    const state = round({
      hands: { a: hand(3), b: hand(5) },
      status: { a: "playing", b: "stopped" },
      deckValues: [freeze()],
    });

    const next = hit(state, "a")!;

    expect(next.pending).toEqual([]);
    expect(next.status.a).toBe("stopped");
    expect(next.roundOver).toBe(true);
  });

  it("Trois d'un coup : la cible reçoit 3 cartes", () => {
    const state = hit(round({ hands: { a: hand(3), b: hand(5) }, deckValues: [three(), 1, 2, plus(4), 9] }), "a")!;

    const next = chooseTarget(state, "a", "b")!;

    expect(values(next.hands.b)).toEqual([5, "three", 1, 2, 4]);
    expect(values(next.deck)).toEqual([9]);
    expect(next.currentPlayer).toBe("b");
  });

  it("Trois d'un coup : s'arrête au premier doublon", () => {
    const state = hit(round({ hands: { a: hand(3), b: hand(5) }, deckValues: [three(), 5, 7] }), "a")!;

    const next = chooseTarget(state, "a", "b")!;

    expect(next.status.b).toBe("busted");
    expect(values(next.deck)).toEqual([7]);
  });

  it("Trois d'un coup : s'arrête à 7 nombres, qui finissent la manche", () => {
    const state = hit(round({ hands: { a: hand(3), b: hand(1, 2, 3, 4, 5) }, deckValues: [three(), 6, 7, 8] }), "a")!;

    const next = chooseTarget(state, "a", "b")!;

    expect(next.roundOver).toBe(true);
    expect(values(next.deck)).toEqual([8]);
  });

  it("Trois d'un coup : les actions tirées pendant sont à attribuer après les 3 cartes", () => {
    const state = hit(round({ hands: { a: hand(3), b: hand(5) }, deckValues: [three(), freeze(), 4, 6] }), "a")!;

    const next = chooseTarget(state, "a", "b")!;

    expect(values(next.hands.b)).toEqual([5, "three", 4, 6]);
    expect(next.pending.map((p) => [p.playerId, p.card.kind])).toEqual([["b", "freeze"]]);
    expect(chooseTarget(next, "b", "a")!.status.a).toBe("stopped");
  });

  it("Trois d'un coup : les actions tirées par une cible éliminée sont défaussées", () => {
    const state = hit(round({ hands: { a: hand(3), b: hand(5) }, deckValues: [three(), freeze(), 5, 6] }), "a")!;

    const next = chooseTarget(state, "a", "b")!;

    expect(next.status.b).toBe("busted");
    expect(next.pending).toEqual([]);
    expect(values(next.discard)).toContain("freeze");
  });

  it("Seconde chance : gardée par le joueur qui la tire s'il n'en a pas", () => {
    const next = hit(round({ hands: { a: hand(3), b: hand(5) }, deckValues: [second()] }), "a")!;

    expect(values(next.hands.a)).toEqual([3, "second"]);
    expect(next.pending).toEqual([]);
    expect(next.currentPlayer).toBe("b");
  });

  it("Seconde chance : annule le prochain doublon, les deux cartes sont défaussées", () => {
    const next = hit(round({ hands: { a: hand(5, second()), b: hand(6) }, deckValues: [5] }), "a")!;

    expect(next.status.a).toBe("playing");
    expect(values(next.hands.a)).toEqual([5]);
    expect(values(next.discard).sort()).toEqual([5, "second"]);
    expect(next.lastDraw).toMatchObject({ playerId: "a", saved: true });
  });

  it("Seconde chance : une deuxième se donne à un autre joueur en jeu qui n'en a pas", () => {
    const state = hit(
      round({
        turnOrder: ["a", "b", "c"],
        hands: { a: hand(3, second()), b: hand(5), c: hand(6) },
        deckValues: [second()],
      }),
      "a",
    )!;

    expect(state.pending.map((p) => [p.playerId, p.card.kind])).toEqual([["a", "second"]]);
    expect(chooseTarget(state, "a", "a")).toBeNull();
    expect(values(chooseTarget(state, "a", "c")!.hands.c)).toEqual([6, "second"]);
  });

  it("Seconde chance : donnée d'office au seul joueur possible, défaussée sans preneur", () => {
    const given = hit(
      round({
        turnOrder: ["a", "b", "c"],
        hands: { a: hand(3, second()), b: hand(5), c: hand(6, second()) },
        deckValues: [second()],
      }),
      "a",
    )!;
    expect(values(given.hands.b)).toEqual([5, "second"]);

    const discarded = hit(
      round({ hands: { a: hand(3, second()), b: hand(5, second()) }, deckValues: [second()] }),
      "a",
    )!;
    expect(discarded.pending).toEqual([]);
    expect(values(discarded.discard)).toEqual(["second"]);
  });
});

describe("pioche", () => {
  it("se reforme en mélangeant la défausse quand elle est vide", () => {
    const next = hit(round({ hands: { a: hand(3), b: hand(5) }, discard: hand(7) }), "a")!;

    expect(values(next.hands.a)).toEqual([3, 7]);
    expect(next.discard).toEqual([]);
  });

  it("refuse Encore quand il ne reste aucune carte", () => {
    expect(hit(round({ hands: { a: hand(3), b: hand(5) } }), "a")).toBeNull();
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

  it("défausse les actions qu'un joueur parti devait attribuer", () => {
    const state = hit(
      round({ turnOrder: ["a", "b", "c"], hands: { a: hand(3), b: hand(5), c: hand(6) }, deckValues: [freeze()] }),
      "a",
    )!;

    const next = leave(state, "a");

    expect(next.pending).toEqual([]);
    expect(next.currentPlayer).toBe("b");
    expect(values(next.discard)).toEqual(["freeze"]);
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

  it("double les nombres avec le ×2, puis ajoute les + et le bonus de 7", () => {
    const state = round({
      turnOrder: ["a", "b", "c", "d"],
      hands: {
        a: hand(3, 10, double()),
        b: hand(3, 10, plus(4), plus(10)),
        c: hand(3, double(), 10, plus(4)),
        d: hand(0, 1, 2, 3, 4, 5, 6, double(), plus(2)),
      },
      status: { a: "stopped", b: "stopped", c: "stopped", d: "playing" },
      roundOver: true,
    });

    expect(roundScores(state)).toEqual({ a: 26, b: 27, c: 30, d: 42 + 2 + 15 });
  });

  it("donne 0 à un joueur éliminé, malgré ses modificateurs", () => {
    const state = round({
      hands: { a: hand(4, double(), plus(10), 4), b: hand(1) },
      status: { a: "busted", b: "stopped" },
      roundOver: true,
    });

    expect(roundScores(state).a).toBe(0);
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
    expect(shown).not.toHaveProperty("discard");
    expect(shown.deckCount).toBe(3);
    expect(JSON.stringify(shown)).not.toContain('"value":7');
  });
});

describe("renamePlayer", () => {
  it("remplace l'identifiant d'un joueur partout", () => {
    const state = round({
      hands: { a: hand(3), b: hand(5) },
      lastDraw: { playerId: "a", card: card(3) },
      pending: [{ playerId: "a", card: freeze() }],
      lastAction: { playerId: "b", card: freeze(), target: "a" },
    });

    const renamed = renamePlayer(state, "a", "z");

    expect(renamed.turnOrder).toEqual(["z", "b"]);
    expect(renamed.currentPlayer).toBe("z");
    expect(Object.keys(renamed.hands)).toEqual(["z", "b"]);
    expect(renamed.status.z).toBe("playing");
    expect(renamed.lastDraw?.playerId).toBe("z");
    expect(renamed.pending[0].playerId).toBe("z");
    expect(renamed.lastAction?.target).toBe("z");
  });
});
