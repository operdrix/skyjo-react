import PageSkeleton from "@/components/PageSkeleton";
import Deck from "@/components/game/Deck";
import GameMenu from "@/components/game/GameMenu";
import GameSettings from "@/components/game/GameSettings";
import Discard from "@/components/game/Discard";
import Instructions from "@/components/game/Instructions";
import ErrorMessage from "@/components/game/messages/ErrorMessage";
import ModalScore from "@/components/game/messages/ModalScore";
import ModalScoreEndGame from "@/components/game/messages/ModalScoreEndGame";
import ReconnectMessage from "@/components/game/messages/ReconnectMessage";
import WaitingDeal from "@/components/game/messages/WaitingDeal";
import PlayerSet from "@/components/game/PlayerSet";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useGameEvents } from "@/hooks/useGameEvents";
import { useWebSocket } from "@/hooks/WebSocket";
import { tableSeats } from "@/game/seats";
import { api } from "@/services/apiService";
import notify from "@/utils/notify";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

const Game = () => {
  const { userId, loading: userLoading } = useUser();
  const { isConnected, sendMessage, loading: wsLoading } = useWebSocket();
  const { game, setGame, sound } = useGame();
  const { gameId } = useParams<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const [waitingDeal, setWaitingDeal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Rediriger vers la création de partie si gameId n'est pas défini dans l'URL
  useEffect(() => {
    if (!gameId) {
      navigate("/create");
    }
  }, [gameId, navigate]);

  //On récupère les informations de la partie
  useEffect(() => {
    if (!gameId || !userId) return;

    const getGame = async () => {
      setLoading(true);
      try {
        const response = await api.get(`game/${gameId}`);
        if (response.data) {
          setGame(response.data);
          if (response.data.state === "pending") {
            navigate(`/join/${gameId}`);
          }
        } else if (response.error) {
          // la partie n'existe pas
          setError("La partie n'existe pas.");
        }
      } catch {
        setError("Une erreur réseau s'est produite.");
      } finally {
        setWaitingDeal(false);
        setLoading(false);
      }
    };
    if (!error) getGame();
  }, [gameId, userId, error, setGame, navigate]);

  // Rediriger vers la salle d'attente si la partie est en attente de joueurs
  useEffect(() => {
    if (!game) return;

    if (game.state === "pending") {
      navigate(`/join/${gameId}`);
    }
  }, [game, navigate, gameId]);

  // Avertir les autres joueurs de la connexion du joueur
  useEffect(() => {
    if (!gameId || !userId || error) return;
    sendMessage("player-joined-game", { room: gameId });
  }, [gameId, userId, sendMessage, error]);

  useGameEvents(setWaitingDeal, !error);

  // Notification de l'utilisateur si c'est son tour
  const notifyPlayerTurn = useCallback(() => {
    if (!game || !userId) return;
    const playerTurn = game.gameData.currentPlayer === userId && game.gameData.currentStep === "draw";
    if (playerTurn) {
      notify("play", !sound);
    }
  }, [game, sound, userId]);

  useEffect(() => {
    notifyPlayerTurn();
  }, [notifyPlayerTurn]);

  // Son de fin de manche, une fois à l'arrivée sur l'écran des scores
  const roundOver = game?.gameData.currentStep === "endGame";
  useEffect(() => {
    if (roundOver) notify("end", !sound);
  }, [roundOver, sound]);

  if (error) {
    return (
      <ErrorMessage
        error={error}
        button={{
          label: "Retour à l'accueil",
          action: () => navigate("/"),
        }}
      />
    );
  }

  if (wsLoading || !isConnected) {
    return <ReconnectMessage />;
  }

  if (loading || userLoading || !game || !userId) {
    return <PageSkeleton />;
  }

  if (waitingDeal) {
    return <WaitingDeal />;
  }

  const seats = tableSeats(game.gameData.turnOrder, userId);

  return (
    <>
      {game.gameData.currentStep === "endGame" && <ModalScoreEndGame />}
      <ModalScore />

      <GameMenu />
      <GameSettings />

      <section className={`game-area container mx-auto h-screen px-2 py-8 sm:py-4`}>
        {/* Ligne 1 : joueur d'en face */}

        {/* <div className={game.players.length === 2 ? 'hidden' : ''}></div> */}
        {/* <div className={game.players.length === 3 ? 'col-span-2' : ''}> */}
        <div className="game-area-top-center">
          <PlayerSet playerId={seats.top} smallSet={game.players.length > 2} />
        </div>
        {/* <div className={game.players.length <= 3 ? 'hidden' : ''}></div> */}

        {/* Ligne 2 */}

        {/* Joueur à gauche */}
        <div className="game-area-middle-left">
          {game.players.length >= 3 ? <PlayerSet playerId={seats.left} smallSet /> : ""}
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
          <p className="text-sm md:text-xl lg:text-2xl text-center text-warning animate-bounce">
            {game.gameData.lastTurn && "Dernier tour !"}
          </p>
        </div>

        {/* Joueur à droite */}
        <div className="game-area-middle-right">
          {game.players.length === 4 ? <PlayerSet playerId={seats.right} smallSet /> : <div></div>}
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
  );
};

export default Game;
