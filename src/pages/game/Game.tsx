import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

    const handleStartGame = (updatedGame: GameType) => {
      console.log("Game started:", updatedGame);
      setGame(updatedGame);
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

    subscribeToEvent("start-game", handleStartGame);
    subscribeToEvent("player-joined-game", handlePlayerJoined);
    subscribeToEvent("player-left-game", handlePlayerLeft);
    subscribeToEvent("update-game-params", setGame);
    subscribeToEvent("play-move", handlePlayMove);

    return () => {
      unsubscribeFromEvent("start-game", handleStartGame);
      unsubscribeFromEvent("player-joined-game", handlePlayerJoined);
      unsubscribeFromEvent("player-left-game", handlePlayerLeft);
      unsubscribeFromEvent("update-game-params", setGame);
      unsubscribeFromEvent("play-move", handlePlayMove);
    };

  }, [socket, isConnected, gameId, subscribeToEvent, unsubscribeFromEvent, error, setGame, game]);

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
      {game.gameData.currentStep === 'endGame' && <ModalScore />}
      <section className={`
        md:container md:mx-auto w-full grow grid gap-4 p-4
        ${game.players.length === 2 ? 'grid-cols-1' : game.players.length === 3 ? 'grid-cols-2' : 'grid-cols-3'}
        `}>
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
        <div className="flex flex-col items-center justify-center gap-4">
          <Instructions />
          <div className="flex justify-center items-center gap-3 md:gap-9">
            {/* Défausse */}
            <Discard />

            {/* Pioche */}
            <Deck />
          </div>
          <p
            className="text-sm md:text-xl lg:text-2xl text-center h-16 text-warning animate-bounce"
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

const ModalScore = () => {
  const { game } = useGame();
  const { sendMessage } = useWebSocket();
  const { userId } = useUser();
  const [loading, setLoading] = useState<boolean>(false);

  const handleNextRound = () => {
    setLoading(true);
    sendMessage("start-game", { room: game?.id });
  }
  return (
    <>
      <dialog id="modal-score" className="modal modal-bottom sm:modal-middle modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Fin de la manche !</h3>
          <p className="py-4">Press ESC key or click the button below to close</p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="btn"
                onClick={handleNextRound}
                disabled={game?.creator !== userId || loading}
              >
                Manche suivante
                {loading && <span className="loading loading-dots loading-xs"></span>}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}

export default Game