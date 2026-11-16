import GuestTag from "@/components/GuestTag";
import type { GameType } from "@/types/types";

// Couleurs d'avatar tirées du thème, attribuées dans l'ordre d'arrivée
const AVATAR_COLORS = [
  "bg-accent text-accent-content",
  "bg-secondary text-secondary-content",
  "bg-success text-success-content",
  "bg-info text-info-content",
];

// Joueurs présents dans la salle d'attente, puis places encore libres.
// `onRemoveBot` (créateur seulement) : un bouton retire chaque robot.
export default function PlayerList({ game, onRemoveBot }: { game: GameType; onRemoveBot?: (botId: string) => void }) {
  const freeSeats = Math.max(0, game.maxPlayers - game.players.length);
  return (
    <ul className="flex flex-col gap-2">
      {game.players.map((player, index) => (
        <li key={player.id} className="flex items-center gap-3 rounded-field bg-base-200 px-3 py-2">
          <span
            aria-hidden="true"
            className={`grid size-10 place-items-center rounded-xl border-2 border-line font-display text-lg font-bold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
          >
            {player.isBot ? "🤖" : player?.username.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1">
            <p className="font-bold">
              {player?.username}
              <GuestTag player={player} />
            </p>
            {player.id === game.creatorPlayer.id && <p className="text-sm text-muted">Créateur de la partie</p>}
          </div>
          {player.isBot && onRemoveBot && (
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              aria-label={`Retirer ${player.username}`}
              title={`Retirer ${player.username}`}
              onClick={() => onRemoveBot(player.id)}
            >
              ✕
            </button>
          )}
        </li>
      ))}
      {Array.from({ length: freeSeats }, (_, index) => (
        <li
          key={`libre-${index}`}
          className="rounded-field border-2 border-dashed px-3 py-3 text-center text-sm text-muted"
        >
          En attente d'un joueur…
        </li>
      ))}
    </ul>
  );
}
