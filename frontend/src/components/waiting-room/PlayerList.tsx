import type { GameType } from "@/types/types";

// Couleurs d'avatar tirées du thème, attribuées dans l'ordre d'arrivée
const AVATAR_COLORS = [
  "bg-accent text-accent-content",
  "bg-secondary text-secondary-content",
  "bg-success text-success-content",
  "bg-info text-info-content",
];

// Joueurs présents dans la salle d'attente, puis places encore libres
export default function PlayerList({ game }: { game: GameType }) {
  const freeSeats = Math.max(0, game.maxPlayers - game.players.length);
  return (
    <ul className="flex flex-col gap-2">
      {game.players.map((player, index) => (
        <li key={player.id} className="flex items-center gap-3 rounded-field bg-base-200 px-3 py-2">
          <span
            aria-hidden="true"
            className={`grid size-10 place-items-center rounded-xl border-2 border-line font-display text-lg font-bold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
          >
            {player?.username.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1">
            <p className="font-bold">{player?.username}</p>
            {player.id === game.creatorPlayer.id && <p className="text-sm text-muted">Créateur de la partie</p>}
          </div>
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
