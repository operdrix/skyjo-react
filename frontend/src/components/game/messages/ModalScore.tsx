import { useGame } from "@/hooks/Game";

const ModalScore = () => {
  const { game } = useGame();

  if (!game) return null;
  return (
    <>
      <dialog id="modal-score" className={`modal modal-bottom sm:modal-middle`}>
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg">Manche n°{game.roundNumber}</h3>
          <p className="my-4">Voici vos scores</p>
          {game.players
            .slice()
            .sort((a, b) => a.game_players.score - b.game_players.score)
            .map(player => (
              <div key={player.id} className="flex justify-between">
                <p className="font-bold text-xl">{player.username}</p>
                <ul className="flex gap-3">
                  {player.game_players.scoreByRound.map((score, index) => (
                    <li key={index}>{score}</li>
                  ))}
                  <li className="font-bold">{player.game_players.score}</li>
                </ul>
              </div>
            ))}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>
            Fermer
          </button>
        </form>
      </dialog>
    </>
  )
}

export default ModalScore;