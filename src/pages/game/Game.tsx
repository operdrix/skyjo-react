import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Deck from "../../components/game/Deck";
import Discard from "../../components/game/Discard";
import Instructions from "../../components/game/Instructions";
import ErrorMessage from "../../components/game/messages/ErrorMessage";
import ReconnectMessage from "../../components/game/messages/ReconnectMessage";
import PlayerSet from "../../components/game/PlayerSet";
import { useGame } from "../../hooks/Game";
import { useUser } from "../../hooks/User";
import { useWebSocket } from "../../hooks/WebSocket";
import type { GameType } from "../../types/types";

const Game = () => {
  const { token, userId, loading: userLoading } = useUser();
  const { socket, isConnected, sendMessage, subscribeToEvent, unsubscribeFromEvent, loading: wsLoading } = useWebSocket()
  const { game, setGame } = useGame();
  const { gameId } = useParams<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const [waitingDeal, setWaitingDeal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Rediriger vers la création de partie si gameId n'est pas défini dans l'URL
  useEffect(() => {
    if (!gameId) {
      navigate("/game/create");
    }
  }, [gameId, navigate]);

  //On récupère les informations de la partie
  useEffect(() => {
    if (!gameId || !token || !userId) return;
    console.log('récupération de la partie', gameId);

    const getGame = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.BACKEND_HOST}/game/${gameId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setGame(data);
          if (data.creator === userId) {
            //setIsCreator(true);
          }
        } else {
          // la partie n'existe pas
          console.error('Error fetching game:', data);
          setError("La partie n'existe pas.");
        }
      } catch (error) {
        console.error('Network error:', error);
        setError("Une erreur réseau s'est produite.");
      } finally {
        setWaitingDeal(false);
        setLoading(false);
      }
    };
    if (!error) getGame();
  }, [gameId, token, userId, error, setGame]);

  // Rediriger vers la salle d'attente si la partie est en attente de joueurs
  useEffect(() => {
    if (!game) return;

    if (game.state === 'pending') {
      navigate(`/join/${gameId}`);
    }

  }, [game, navigate, gameId]);

  // Avertir les autres joueurs de la connexion du joueur
  useEffect(() => {
    if (!gameId || !userId || error) return;
    sendMessage("player-joined-game", { room: gameId, userId });
  }, [gameId, userId, sendMessage, error]);

  // souscriptions aux événements
  useEffect(() => {
    if (!socket || !isConnected || error) return;

    const handleWaitingDeal = () => {
      console.log("Waiting deal");
      setWaitingDeal(true);
    }

    const handleStartGame = (updatedGame: GameType) => {
      console.log("Game started:", updatedGame);
      setGame(updatedGame);
      setWaitingDeal(false);
    };

    const handlePlayerJoined = (updatedGame: GameType) => {
      console.log("Player joined game:", updatedGame);
      setGame(updatedGame);
    };

    const handlePlayerLeft = (updatedGame: GameType) => {
      console.log("Player left game:", updatedGame);
      setGame(updatedGame);
    }

    const handlePlayMove = (updatedGame: GameType) => {
      console.log("Play move:", updatedGame.gameData);
      setGame(updatedGame);
    }

    const handleGoToNewGame = ({ gameId, players }: {
      gameId: string,
      players: string[]
    }) => {
      if (!gameId || !players) return;
      if (!userId) return;
      console.log("Go to new game:", gameId, players);
      if (players.includes(userId)) {
        console.log(`Redirect to new game /game/${gameId}`);
        navigate(`/game/${gameId}`);
      } else {
        navigate(`/`);
      }
    }

    subscribeToEvent("waiting-deal", handleWaitingDeal);
    subscribeToEvent("start-game", handleStartGame);
    subscribeToEvent("player-joined-game", handlePlayerJoined);
    subscribeToEvent("player-left-game", handlePlayerLeft);
    subscribeToEvent("update-game-params", setGame);
    subscribeToEvent("play-move", handlePlayMove);
    subscribeToEvent("go-to-new-game", handleGoToNewGame);

    return () => {
      unsubscribeFromEvent("waiting-deal", handleWaitingDeal);
      unsubscribeFromEvent("start-game", handleStartGame);
      unsubscribeFromEvent("player-joined-game", handlePlayerJoined);
      unsubscribeFromEvent("player-left-game", handlePlayerLeft);
      unsubscribeFromEvent("update-game-params", setGame);
      unsubscribeFromEvent("play-move", handlePlayMove);
      unsubscribeFromEvent("go-to-new-game", handleGoToNewGame);
    };

  }, [socket, isConnected, gameId, subscribeToEvent, unsubscribeFromEvent, error, setGame, game, userId, navigate]);

  if (wsLoading || !isConnected) {
    return <ReconnectMessage />
  }

  if (loading || userLoading || !game || !userId) {
    return (
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-5">
        <div className="flex lg:col-span-2 space-y-4 flex-col gap-4">
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-4 w-28"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-full"></div>
        </div>
        <div className="flex space-y-4 flex-col gap-4">
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-4 w-28"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        button={{
          label: "Retour à l'accueil",
          action: () => navigate('/')
        }}
      />
    )
  }

  if (waitingDeal) {
    return (
      <div className="hero bg-base-200 min-h-[50vh] p-20">
        <div className="hero-content flex-col lg:flex-row text-center">
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" enableBackground="new 0 0 64 64" stroke="currentColor" className="size-96 max-w-sm text-success">
            <polygon fill="none" strokeWidth="2" strokeMiterlimit="10" points="44,59 16,45 36,5 63,19 " />
            <polyline fill="none" strokeWidth="2" strokeMiterlimit="10" points="31.899,14.004 28,6 1,20 19,59 32,52.964" />
            <line fill="none" strokeWidth="2" strokeMiterlimit="10" x1="38" y1="9" x2="37" y2="11" />
            <line fill="none" strokeWidth="2" strokeMiterlimit="10" x1="7" y1="23" x2="6" y2="21" />
            <line fill="none" strokeWidth="2" strokeMiterlimit="10" x1="43" y1="53" x2="42" y2="55" />
            <path fill="none" strokeWidth="2" strokeMiterlimit="10" d="M33,25c-2.848,5.281,3,15,3,15s11.151,0.28,14-5c1.18-2.188,1.377-5.718-1-7c-2.188-1.18-5.82-1.188-7,1c1.18-2.188,0.188-4.82-2-6C37.624,21.718,34.181,22.813,33,25z" />
          </svg>
          <div>
            <h1 className="text-5xl font-bold">
              Nouvelle manche
            </h1>
            <p className="py-6 text-xl">
              Mélange des cartes en cours ... <br /><span className="loading loading-dots loading-lg text-success"></span>
            </p>
          </div>
        </div>
      </div>)
  }

  // Assignation des identifiants des joueurs aux positions de la table
  const playerIndex = game.gameData.turnOrder.indexOf(userId);
  let playerIdTop = '';
  let playerIdLeft = '';
  let playerIdRight = '';

  const playerCount = game.players.length;
  const turnOrder = game.gameData.turnOrder;
  const positions = ["Top", "Left", "Right"];

  positions.forEach((position, index) => {
    if (playerCount > index + 1) {
      const playerId = turnOrder[(playerIndex + index + 1) % playerCount];
      if (position === "Top") playerIdTop = playerId;
      if (position === "Left") playerIdLeft = playerId;
      if (position === "Right") playerIdRight = playerId;
    }
  });

  return (
    <>
      {(game.gameData.currentStep === 'endGame') && <ModalScoreEndGame />}
      <ModalScore />
      <section className={`relative
        md:container md:mx-auto w-full grow grid md:gap-4 p-4
        ${game.players.length === 2 ? 'grid-cols-1' : game.players.length === 3 ? 'grid-cols-2' : 'grid-cols-3'}
        `}>

        <div className="flex flex-col gap-4 absolute p-2">
          <div className="tooltip tooltip-right" data-tip="Tableau des scores">
            <button
              className="btn btn-circle"
              onClick={() => {
                const modal = document.getElementById('modal-score');
                if (modal) {
                  (modal as HTMLDialogElement).showModal();
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" stroke="currentColor">
                <path d="M17 8V6C17 4.11438 17 3.17157 16.4142 2.58579C15.8284 2 14.8856 2 13 2H11C9.11438 2 8.17157 2 7.58579 2.58579C7 3.17157 7 4.11438 7 6V8" strokeWidth="1.5" />
                <path d="M11.1459 12.0225C11.5259 11.3408 11.7159 11 12 11C12.2841 11 12.4741 11.3408 12.8541 12.0225L12.9524 12.1989C13.0603 12.3926 13.1143 12.4894 13.1985 12.5533C13.2827 12.6172 13.3875 12.641 13.5972 12.6884L13.7881 12.7316C14.526 12.8986 14.895 12.982 14.9828 13.2643C15.0706 13.5466 14.819 13.8407 14.316 14.429L14.1858 14.5812C14.0429 14.7483 13.9714 14.8319 13.9392 14.9353C13.9071 15.0387 13.9179 15.1502 13.9395 15.3733L13.9592 15.5763C14.0352 16.3612 14.0733 16.7536 13.8435 16.9281C13.6136 17.1025 13.2682 16.9435 12.5773 16.6254L12.3986 16.5431C12.2022 16.4527 12.1041 16.4075 12 16.4075C11.8959 16.4075 11.7978 16.4527 11.6014 16.5431L11.4227 16.6254C10.7318 16.9435 10.3864 17.1025 10.1565 16.9281C9.92674 16.7536 9.96476 16.3612 10.0408 15.5763L10.0605 15.3733C10.0821 15.1502 10.0929 15.0387 10.0608 14.9353C10.0286 14.8319 9.95713 14.7483 9.81418 14.5812L9.68403 14.429C9.18097 13.8407 8.92945 13.5466 9.01723 13.2643C9.10501 12.982 9.47396 12.8986 10.2119 12.7316L10.4028 12.6884C10.6125 12.641 10.7173 12.6172 10.8015 12.5533C10.8857 12.4894 10.9397 12.3926 11.0476 12.1989L11.1459 12.0225Z" strokeWidth="1.5" />
                <path d="M19.4286 16.975C19.7972 16.0553 20 15.0513 20 14C20 9.58172 16.4183 6 12 6C7.58172 6 4 9.58172 4 14C4 18.4183 7.58172 22 12 22C13.0513 22 14.0553 21.7972 14.975 21.4286" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="tooltip tooltip-right" data-tip="Règles du jeu">
            <button className="btn btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Ligne 1 : joueur d'en face */}

        <div className={game.players.length === 2 ? 'hidden' : ''}></div>
        <div className={game.players.length === 3 ? 'col-span-2' : ''}>
          <PlayerSet playerId={playerIdTop} />
        </div>
        <div className={game.players.length <= 3 ? 'hidden' : ''}></div>

        {/* Ligne 2 */}

        {/* Joueur à gauche */}
        {game.players.length >= 3 ? <PlayerSet playerId={playerIdLeft} /> : <div></div>}

        {/* Zone de pioche et défausse */}
        <div className="flex flex-col items-center justify-center md:gap-4">
          <Instructions />
          <div className="flex justify-center items-center gap-3 md:gap-9">
            {/* Défausse */}
            <Discard />

            {/* Pioche */}
            <Deck />
          </div>
          <p
            className="text-sm md:text-xl lg:text-2xl text-center text-warning animate-bounce"
          >
            {game.gameData.lastTurn && 'Dernier tour !'}
          </p>
        </div>

        {/* Joueur à droite */}
        {game.players.length === 4 ? <PlayerSet playerId={playerIdRight} /> : <div></div>}

        {/* Ligne 3 : jour actuel */}

        <div className={game.players.length === 2 ? 'hidden' : ''}></div>
        <div className={game.players.length === 3 ? 'col-span-2' : ''}>
          <PlayerSet playerId={userId} isCurrentPlayerSet />
        </div>
        <div className={game.players.length <= 3 ? 'hidden' : ''}></div>

      </section>
    </>
  )
}

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

export default Game