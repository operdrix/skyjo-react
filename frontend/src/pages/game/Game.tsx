import Deck from "@/components/game/Deck";
import Discard from "@/components/game/Discard";
import Instructions from "@/components/game/Instructions";
import ErrorMessage from "@/components/game/messages/ErrorMessage";
import ModalScore from "@/components/game/messages/ModalScore";
import ModalScoreEndGame from "@/components/game/messages/ModalScoreEndGame";
import ReconnectMessage from "@/components/game/messages/ReconnectMessage";
import WaitingDeal from "@/components/game/messages/WaitingDeal";
import PlayerSet from "@/components/game/PlayerSet";
import Rules from "@/components/game/Rules";
import ToggleTheme from "@/components/nav/ToggleTheme";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import type { GameType } from "@/types/types";
import { buildApiUrl } from "@/utils/apiUtils";
import notify from "@/utils/notify";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Game = () => {
  const { token, userId, loading: userLoading } = useUser();
  const { socket, isConnected, sendMessage, subscribeToEvent, unsubscribeFromEvent, loading: wsLoading } = useWebSocket()
  const { game, setGame, sound, setSound } = useGame();
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
        const response = await fetch(buildApiUrl(`game/${gameId}`), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setGame(data);
          if (data.state === 'pending') {
            navigate(`/join/${gameId}`);
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
  }, [gameId, token, userId, error, setGame, navigate]);

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

  // Notification de l'utilisateur si c'est son tour
  const notifyPlayerTurn = useCallback(() => {
    if (!game || !userId) return;
    const playerTurn = (game.gameData.currentPlayer === userId && game.gameData.currentStep === 'draw');
    if (playerTurn) {
      notify('play', !sound);
    }
  }, [game, sound, userId]);

  useEffect(() => {
    notifyPlayerTurn();
  }, [notifyPlayerTurn]);

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

  if (waitingDeal) {
    return <WaitingDeal />
  }

  // Assignation des identifiants des joueurs aux positions de la table
  const playerIndex = game.gameData.turnOrder.indexOf(userId);
  let playerIdTop = '';
  let playerIdLeft = '';
  let playerIdRight = '';

  const playerCount = game.players.length;
  const turnOrder = game.gameData.turnOrder;
  const positions = (playerCount === 4) ? ["Left", "Top", "Right"] : (playerCount === 3) ? ["Left", "Top"] : ["Top"];

  positions.forEach((position, index) => {
    if (playerCount > index + 1) {
      const playerId = turnOrder[(playerIndex + index + 1) % playerCount];
      if (position === "Left") playerIdLeft = playerId;
      if (position === "Top") playerIdTop = playerId;
      if (position === "Right") playerIdRight = playerId;
    }
  });

  // Notification de fin de partie
  if (game.gameData.currentStep === 'endGame') {
    notify('end', !sound);
  }

  return (
    <>
      {(game.gameData.currentStep === 'endGame') && <ModalScoreEndGame />}
      <ModalScore />

      {/* Modal d'affichage des règles */}
      <dialog id="modalRules" className="modal">
        <div className="modal-box">
          <Rules />
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Fermer</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* Boutons de gauche */}
      <div className="flex flex-col gap-4 absolute p-2 mt-8 sm:mt-4">
        <div className="tooltip tooltip-right" data-tip="Retour à l'accueil">
          <button
            className="btn btn-circle"
            onClick={() => navigate('/')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Bouton pour afficher les scores */}
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
        {/* Bouton pour afficher les règles */}
        <div className="tooltip tooltip-right" data-tip="Règles du jeu">
          <button
            className="btn btn-circle"
            onClick={() => {
              const modal = document.getElementById('modalRules');
              if (modal) {
                (modal as HTMLDialogElement).showModal();
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Boutons de droite */}
      <div className="flex flex-col gap-4 absolute p-2 mt-8 sm:mt-4 right-0">
        <ToggleTheme className="btn-circle" />
        <label className="swap swap-rotate btn btn-circle">
          <input type="checkbox" checked={sound} onChange={() => setSound(!sound)} />
          {/* volume on icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 swap-on">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>

          {/* volume off icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 swap-off">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        </label>
      </div>

      <section className={`game-area container mx-auto h-screen px-2 py-8 sm:py-4`}>
        {/* Ligne 1 : joueur d'en face */}

        {/* <div className={game.players.length === 2 ? 'hidden' : ''}></div> */}
        {/* <div className={game.players.length === 3 ? 'col-span-2' : ''}> */}
        <div className="game-area-top-center">
          <PlayerSet playerId={playerIdTop} smallSet={game.players.length > 2} />
        </div>
        {/* <div className={game.players.length <= 3 ? 'hidden' : ''}></div> */}

        {/* Ligne 2 */}

        {/* Joueur à gauche */}
        <div className="game-area-middle-left">
          {game.players.length >= 3 ? <PlayerSet playerId={playerIdLeft} smallSet /> : ""}
        </div>

        {/* Zone de pioche et défausse */}
        <div className="game-area-middle-center flex flex-col items-center justify-center md:gap-4">
          <Instructions />
          <div className="flex justify-center items-center gap-3 md:gap-9">
            {/* Pioche */}
            <Deck />

            {/* Défausse */}
            <Discard />
          </div>
          <p
            className="text-sm md:text-xl lg:text-2xl text-center text-warning animate-bounce"
          >
            {game.gameData.lastTurn && 'Dernier tour !'}
          </p>
        </div>

        {/* Joueur à droite */}
        <div className="game-area-middle-right">
          {game.players.length === 4 ? <PlayerSet playerId={playerIdRight} smallSet /> : <div></div>}
        </div>
        {/* Ligne 3 : jour actuel */}

        {/* <div className={game.players.length === 2 ? 'hidden' : ''}></div> */}
        {/* <div className={game.players.length === 3 ? 'col-span-2' : ''}> */}
        <div className="game-area-bottom-center">

          <PlayerSet playerId={userId} isCurrentPlayerSet />
        </div>
        {/* <div className={game.players.length <= 3 ? 'hidden' : ''}></div> */}

      </section>
    </>
  )
}

export default Game