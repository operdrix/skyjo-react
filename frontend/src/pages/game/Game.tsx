import PageSkeleton from "@/components/PageSkeleton";
import Deck from "@/components/game/Deck";
import GameMenu from "@/components/game/GameMenu";
import GameSettings from "@/components/game/GameSettings";
import Discard from "@/components/game/Discard";
import Instructions from "@/components/game/Instructions";
import ErrorMessage from "@/components/game/messages/ErrorMessage";
import ModalScore from "@/components/game/messages/ModalScore";
import RoundResults from "@/components/game/RoundResults";
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

  // Avertir les autres joueurs de la connexion du joueur (à chaque connexion du socket)
  useEffect(() => {
    if (!gameId || !userId || error || !isConnected) return;
    sendMessage("player-joined-game", { room: gameId });
  }, [gameId, userId, sendMessage, error, isConnected]);

  useGameEvents(gameId, setWaitingDeal, !error);

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
      <ModalScore />

      <div className="flex h-dvh flex-col">
        {/* Barre d'outils : quitter, scores, règles à gauche ; thème et son à droite */}
        <div className="flex items-center justify-between px-2 pt-2">
          <GameMenu />
          <GameSettings />
        </div>

        <section
          className={`game-area mx-auto w-full max-w-6xl px-2 pb-2 ${game.players.length === 2 ? "game-area-duel" : ""} ${roundOver ? "game-area-results" : ""}`}
        >
          {/* Ligne 1 : joueur d'en face */}
          <div className="game-area-top-center">
            <PlayerSet playerId={seats.top} smallSet={game.players.length > 2} />
          </div>

          {/* Ligne 2 */}

          {/* Joueur à gauche */}
          {game.players.length >= 3 && (
            <div className="game-area-middle-left">
              <PlayerSet playerId={seats.left} smallSet />
            </div>
          )}

          {/* Zone de pioche et défausse */}
          <div className="game-area-middle-center flex flex-col items-center justify-center">
            {roundOver ? (
              <RoundResults />
            ) : (
              <div className="flex items-center justify-center gap-3 md:gap-9">
                {/* Pioche */}
                <Deck />

                {/* Défausse */}
                <Discard />
              </div>
            )}
          </div>

          {/* Joueur à droite */}
          {game.players.length === 4 && (
            <div className="game-area-middle-right">
              <PlayerSet playerId={seats.right} smallSet />
            </div>
          )}
          {/* Ligne 3 : jour actuel */}
          <div className="game-area-bottom-center">
            <PlayerSet playerId={userId} isCurrentPlayerSet />
          </div>

          {/* Bandeau du bas : consigne en cours */}
          {!roundOver && (
            <div className="game-area-hint">
              <div className="game-hint" role="status">
                <Instructions />
                {game.gameData.lastTurn && (
                  <span className="badge badge-warning shrink-0 font-bold">Dernier tour !</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Game;
