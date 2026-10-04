import ScoreTable from "@/components/game/ScoreTable";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

const players = [
  { id: "BOB", username: "bob", game_players: { score: 50, scoreByRound: [20, 30] } },
  { id: "ALICE", username: "alice", game_players: { score: 8, scoreByRound: [12, -4] } },
];

const rows = () => screen.getAllByRole("row").slice(1);

describe("ScoreTable", () => {
  it("détaille chaque manche, classe les joueurs et repère le joueur courant", () => {
    render(<ScoreTable players={players} userId="BOB" />);

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["#", "Joueur", "M1", "M2", "Total"]);
    expect(rows().map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(["1", "2"]);
    expect(rows()[0].textContent).toContain("alice");
    expect(rows()[0].textContent).toContain("8");
    expect(rows()[1].getAttribute("aria-current")).toBe("true");
    expect(rows()[1].textContent).toContain("toi");
  });

  it("résume la dernière manche", () => {
    render(<ScoreTable players={players} userId="BOB" variant="round" />);

    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["#", "Joueur", "Manche", "Total"]);
    expect(rows()[0].textContent).toContain("−4");
    expect(rows()[1].textContent).toContain("+30");
  });

  it("indique qui veut rejouer en fin de partie", () => {
    render(<ScoreTable players={players} userId="BOB" variant="round" playAgain={["ALICE"]} />);

    expect(within(rows()[0]).getByLabelText("veut rejouer")).toBeTruthy();
    expect(within(rows()[1]).getByLabelText("en attente")).toBeTruthy();
  });
});
