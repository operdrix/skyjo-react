import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import { GameType } from "@/types/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const ModalScoreEndGame = () => {
  const { game, setGame } = useGame();
  const { sendMessage, subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const { userId } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(1);

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

  const handleChangePosition = () => {
    if (position === 1) { // middle
      setPosition(2);
    } else if (position === 2) { // bottom
      setPosition(3);
    } else if (position === 3) { // middle
      setPosition(4);
    } else { // top
      setPosition(1);
    }
  }

  if (!game || !userId) return null;

  const finished = game.state === 'finished';
  const playersPlayAgain = game.playersPlayAgain || [];

  return (
    <>
      <dialog
        id="modal-score-end-game"
        className={`
        modal 
        modal-open 
        ${position === 1 || position === 3 ? 'modal-bottom' : 'modal-top'} 
        ${position === 1 || position === 3 ? 'sm:modal-middle' : position === 2 ? 'sm:modal-bottom' : 'sm:modal-top'}
        `}>
        <div className="modal-box !max-w-2xl glass">
          <div className="tooltip tooltip-left absolute right-2 top-2" data-tip="Déplacer">
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={handleChangePosition}
            >
              {/* Flèche vers le haut */}
              {(position === 2 || position === 3) &&
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  className="size-6 hidden sm:block"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
                </svg>
              }
              {(position === 1 || position === 3) &&
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  className="size-6 sm:hidden"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
                </svg>
              }

              {/* Flèche vers le bas */}
              {(position === 1 || position === 4) &&
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  className="size-6 hidden sm:block"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
                </svg>
              }
              {(position === 2 || position === 4) &&
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  className="size-6 sm:hidden"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
                </svg>
              }
            </button>
          </div>
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
              <div
                key={player.id}
                className="flex justify-between items-center flex-wrap gap-2 border-l-2 border-base-content -ml-3 pl-3 py-1 mb-1 bg-base-100/15 rounded-r-lg"
              >
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
                  {finished && index + 1} {player.username}<sup className="text-xs">{game.creator === player.id && '👑'}</sup>
                </div>
                <ul className="flex-grow flex gap-3 justify-end flex-wrap">
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
                  <div className="flex flex-grow justify-end max-sm:p-2">
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
                    className={`btn ${isCreator ? 'btn-success' : 'btn-ghost'}`}
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