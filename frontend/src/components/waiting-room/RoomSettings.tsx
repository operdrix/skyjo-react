import type { GameType } from "@/types/types";

// Réglages du créateur : nombre de joueurs maximum, robots et lancement de la partie
export default function RoomSettings({
  game,
  starting,
  onChangeMaxPlayers,
  onAddBot,
  onStart,
}: {
  game: GameType;
  starting: boolean;
  onChangeMaxPlayers: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddBot: () => void;
  onStart: () => void;
}) {
  const full = game.players.length >= game.maxPlayers;
  return (
    <>
      <div className="divider"></div>
      <h3 className="text-xl font-semibold">Paramètres de jeu</h3>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between">
          <span>Nombre de joueurs max</span>
          <div>
            <input
              type="range"
              min={Math.max(2, game.players.length)}
              max="4"
              defaultValue={game.maxPlayers || 4}
              className="range range-primary"
              step="1"
              onChange={onChangeMaxPlayers}
            />
            <div className="flex w-full justify-between px-2 text-xs">
              {game.players.length <= 2 && <span>2</span>}
              {game.players.length <= 3 && <span>3</span>}
              <span>4</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Jouer contre l'ordinateur</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={onAddBot} disabled={full}>
            🤖 Ajouter un robot
          </button>
        </div>
      </div>
      <div className="flex flex-1 items-end justify-center">
        <button
          className="btn btn-primary btn-lg w-full"
          onClick={onStart}
          disabled={game.players.length < 2 || starting}
        >
          Lancer la partie
          {starting && <span className="loading loading-spinner loading-sm"></span>}
        </button>
      </div>
    </>
  );
}
