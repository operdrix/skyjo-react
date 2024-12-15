import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../../../hooks/Game";
import { useUser } from "../../../hooks/User";
import { useWebSocket } from "../../../hooks/WebSocket";
import { GameType } from "../../../types/types";

const ModalScoreEndGame = () => {
  const { game, setGame } = useGame();
  const { sendMessage, subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const { userId } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [isCreator, setIsCreator] = useState<boolean>(false);

  useEffect(() => {
    if (!game || !userId) return;
    setIsCreator(game.creator === userId)

    const handlePlayAgain = (newGame: GameType) => {
      setGame(newGame);
    }

    subscribeToEvent('play-again', handlePlayAgain)
    return () => {
      unsubscribeFromEvent('play-again', handlePlayAgain)
    }
  }, [game, setGame, subscribeToEvent, unsubscribeFromEvent, userId]);

  const handleNextRound = () => {
    setLoading(true);
    if (!game) return;
    if (game.state === 'finished') {
      sendMessage("restart-game", { room: game.id });
    } else {
      sendMessage("start-game", { room: game?.id });
    }
  }

  const handleRequestNewGame = () => {
    if (!game || !userId) return;
    const playersPlayAgain = game.playersPlayAgain || [];
    playersPlayAgain.push(userId);
    sendMessage("play-again", { room: game.id, playersPlayAgain });
    return
  }

  if (!game || !userId) return null;

  const finished = game.state === 'finished';
  const playersPlayAgain = game.playersPlayAgain || [];

  return (
    <>
      <dialog id="modal-score-end-game" className={`modal modal-bottom sm:modal-middle modal-open`}>
        <div className="modal-box !max-w-2xl">
          {finished ?
            <h3 className="font-bold text-lg"><span className="text-4xl">🎉</span> Fin de la partie en {game.roundNumber} manches.</h3>
            :
            <h3 className="font-bold text-lg"><span className="text-4xl">🎉</span> Fin de la manche {game.roundNumber} !</h3>
          }
          <p className="my-4">Felicitations ! Voici vos scores :</p>
          {game.players
            .slice()
            .sort((a, b) => a.game_players.score - b.game_players.score)
            .map((player, index) => (
              <div key={player.id} className="flex justify-between">
                <div className="font-bold text-xl">
                  {finished &&
                    <>
                      {playersPlayAgain.includes(player.id) ?
                        <div className="tooltip tooltip-right w-7" data-tip="Veut rejouer">✅</div>
                        :
                        <div className="tooltip tooltip-right w-7" data-tip="En attente">
                          <span className="loading loading-dots loading-xs"></span>
                        </div>
                      }
                    </>
                  }
                  {finished && index + 1} {player.username}<sup>{game.creator === player.id && '👑'}</sup>
                </div>
                <ul className="flex gap-3">
                  {player.game_players.scoreByRound.map((score, index) => (
                    <li className="w-5" key={index}>{score}</li>
                  ))}
                  <li className="font-mono">|</li>
                  <li className="font-bold w-6">{player.game_players.score}</li>
                </ul>
              </div>
            ))}
          <div className="modal-action justify-start">
            <form className="flex-1" method="dialog">
              {finished ?
                <div className="flex justify-between flex-wrap">
                  <div className="flex items-center max-sm:p-2">
                    {isCreator && playersPlayAgain.length >= 2 ?
                      <button
                        className="btn btn-success"
                        onClick={handleNextRound}
                        disabled={loading}
                      >
                        🔁 Nouvelle partie
                      </button>
                      :
                      <p>
                        {isCreator ?
                          "Attendez d'autres joueurs pour rejouer"
                          :
                          playersPlayAgain.includes(userId) ? "Attendez que le créateur lance une nouvelle partie" : "Voulez-vous rejouer ?"
                        }
                      </p>
                    }
                  </div>
                  <div className="flex max-sm:p-2">
                    <button
                      className="btn btn-success"
                      onClick={handleRequestNewGame}
                      disabled={playersPlayAgain.includes(userId) || loading}
                    >
                      {playersPlayAgain.includes(userId) ? '✅' : 'Ok pour rejouer'}
                    </button>
                    <button className="btn btn-ghost ml-2">
                      <Link to={'/'}>Quitter</Link>
                    </button>
                  </div>
                </div>
                :
                <div className="flex justify-end">
                  <button
                    className="btn"
                    onClick={handleNextRound}
                    disabled={!isCreator || loading}
                  >
                    {isCreator ? 'Manche suivante' : 'En attente du créateur'}
                    {loading && <span className="loading loading-dots loading-xs"></span>}
                  </button>
                </div>
              }
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}

export default ModalScoreEndGame;