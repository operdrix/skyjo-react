import type { GameType } from "@/types/types";
import { useState } from "react";
import { useNavigate } from "react-router";

// Une partie de l'historique : résultat, joueurs, manches ; suppression possible pour le créateur d'une partie non terminée
export default function GameHistoryCard({
  game,
  userId,
  onDelete,
}: {
  game: GameType;
  userId: string | null;
  onDelete: (gameId: string) => void;
}) {
  const navigate = useNavigate();
  // Confirmation dans la carte plutôt qu'une boîte native du navigateur
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="panel flex w-full justify-between gap-3 p-4">
      <div className="flex flex-col justify-between gap-2">
        <div>
          <span
            className={`badge font-bold ${game.winner === userId ? "badge-success" : game.winner ? "badge-error" : "badge-info"}`}
          >
            {game.winner === userId ? "🥳 Victoire !" : game.winner ? "😭 Défaite" : "🔄 En cours"}
          </span>
          <p className="mt-2">
            {`${game.players?.length} joueurs : `}
            {game.players?.map((player, index) => (
              <span key={player.id}>
                {player.username}
                {index < game.players.length - 2 ? ", " : index === game.players.length - 2 ? " et " : ""}
              </span>
            ))}
          </p>
        </div>
        <p className="text-xs text-muted">{new Date(game.createdAt).toLocaleDateString("fr-FR")}</p>
      </div>
      <div className="flex flex-col justify-between">
        <p className="text-center">
          <span className="font-display text-4xl font-bold tabular-nums">{game.roundNumber}</span>
          <br /> manches
        </p>
        {confirming ? (
          <div className="flex flex-col items-end gap-1" role="group" aria-label="Confirmer la suppression">
            <p className="text-sm font-semibold">Supprimer cette partie ?</p>
            <div className="flex gap-2">
              <button className="btn btn-xs btn-ghost" onClick={() => setConfirming(false)}>
                Annuler
              </button>
              <button className="btn btn-xs btn-error" onClick={() => onDelete(game.id)}>
                Oui, supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            {game.state != "finished" && game.creator === userId && (
              <button
                onClick={() => setConfirming(true)}
                className="btn btn-xs btn-error"
                aria-label="Supprimer la partie"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            )}
            <button onClick={() => navigate(`/game/${game.id}`)} className="btn btn-xs">
              Consulter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
