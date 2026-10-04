import GameHistoryCard from "@/components/dashboard/GameHistoryCard";
import type { GameType } from "@/types/types";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

const game = {
  id: "g1",
  state: "playing",
  creator: "ALICE",
  winner: null,
  roundNumber: 2,
  createdAt: "2026-10-04T10:00:00Z",
  players: [
    { id: "ALICE", username: "alice" },
    { id: "BOB", username: "bob" },
  ],
} as unknown as GameType;

const renderCard = (onDelete = vi.fn()) => {
  render(
    <MemoryRouter>
      <GameHistoryCard game={game} userId="ALICE" onDelete={onDelete} />
    </MemoryRouter>,
  );
  return onDelete;
};

describe("suppression d'une partie depuis l'historique", () => {
  it("demande confirmation dans la carte avant de supprimer", () => {
    const confirm = vi.spyOn(window, "confirm");
    const onDelete = renderCard();

    fireEvent.click(screen.getByRole("button", { name: /supprimer la partie/i }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /oui, supprimer/i }));
    expect(onDelete).toHaveBeenCalledWith("g1");
  });

  it("peut être annulée", () => {
    const onDelete = renderCard();
    fireEvent.click(screen.getByRole("button", { name: /supprimer la partie/i }));
    fireEvent.click(screen.getByRole("button", { name: /annuler/i }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /oui, supprimer/i })).toBeNull();
  });
});
