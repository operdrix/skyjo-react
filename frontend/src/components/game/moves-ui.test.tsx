import Deck from "@/components/game/Deck";
import Discard from "@/components/game/Discard";
import PlayerSet from "@/components/game/PlayerSet";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ game: null as unknown, sendMessage: vi.fn(), setGame: vi.fn() }));

vi.mock("@/hooks/Game", () => ({ useGame: () => ({ game: state.game, setGame: state.setGame, sound: false }) }));
vi.mock("@/hooks/User", () => ({ useUser: () => ({ userId: "ALICE" }) }));
vi.mock("@/hooks/useGameAction", () => ({ useGameAction: () => state.sendMessage }));
vi.mock("@/utils/notify", () => ({ default: vi.fn() }));

const card = (id: string, value: number, revealed = false) => ({ id, value, color: "green", revealed, onHand: false });

function makeGame(step: string) {
  return {
    id: "g1",
    players: [
      { id: "ALICE", username: "alice" },
      { id: "BOB", username: "bob" },
    ],
    gameData: {
      currentStep: step,
      currentPlayer: "ALICE",
      turnOrder: ["ALICE", "BOB"],
      deckCards: [card("d1", 7), card("d2", 3)],
      discardPile: [card("x1", 9, true)],
      playersCards: { ALICE: [card("a1", 5), card("a2", 11)], BOB: [card("b1", 2)] },
    },
  };
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

// Les cartes cliquables sont des div (classe cursor-pointer)
function clickFirstCard(container: HTMLElement) {
  fireEvent.click(container.querySelector(".cursor-pointer")!);
}

// Le coup est envoyé au serveur sans modifier l'état React reçu
function playAndCheck(step: string, click: () => void) {
  const game = makeGame(step);
  const before = structuredClone(game);
  state.game = game;
  click();
  expect(game).toEqual(before);
  return state.sendMessage.mock.calls[0];
}

describe("coups envoyés par les composants", () => {
  it("pioche sans modifier la partie affichée", () => {
    const [event, payload] = playAndCheck("draw", () => {
      clickFirstCard(render(<Deck />).container);
    });

    expect(event).toBe("play-move");
    expect(payload.gameData.currentStep).toBe("decide-deck");
  });

  it("prend la défausse sans modifier la partie affichée", () => {
    const [, payload] = playAndCheck("draw", () => {
      clickFirstCard(render(<Discard />).container);
    });

    expect(payload.gameData.currentStep).toBe("replace-discard");
  });

  it("retourne une carte de son jeu sans modifier la partie affichée", () => {
    const [, payload] = playAndCheck("flip-deck", () => {
      clickFirstCard(render(<PlayerSet playerId="ALICE" isCurrentPlayerSet />).container);
    });

    expect(payload.gameData.playersCards.ALICE[0].revealed).toBe(true);
  });
});
