import type { GameType } from "@/types/types";

// Joueurs présents dans la salle d'attente
export default function PlayerList({ game }: { game: GameType }) {
  return (
    <ul className="flex flex-wrap gap-4">
      {game.players.map((player) => (
        <li key={player.id} className="flex items-center gap-2">
          <div className="avatar avatar-online avatar-placeholder">
            <div className="bg-neutral text-neutral-content w-12 mask mask-squircle">
              <span className="text-xl">{player?.username.charAt(0)}</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg">{player?.username}</h2>
            {player.id === game.creatorPlayer.id && <p className="text-sm text-gray-500">Créateur de la partie</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
