import PageSkeleton from "@/components/PageSkeleton";
import BancoTable from "@/components/banco/BancoTable";
import ColonnesTable from "@/components/game/ColonnesTable";
import ErrorMessage from "@/components/game/messages/ErrorMessage";
import ReconnectMessage from "@/components/game/messages/ReconnectMessage";
import WaitingDeal from "@/components/game/messages/WaitingDeal";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useGameEvents } from "@/hooks/useGameEvents";
import { useWebSocket } from "@/hooks/WebSocket";
import { isMyTurn, isRoundOver } from "@/game/turn";
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
    if (isMyTurn(game, userId)) {
      notify("play", !sound);
    }
  }, [game, sound, userId]);

  useEffect(() => {
    notifyPlayerTurn();
  }, [notifyPlayerTurn]);

  // Son de fin de manche, une fois à l'arrivée sur l'écran des scores
  const roundOver = game ? isRoundOver(game) : false;
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

  return game.gameType === "banco" ? <BancoTable /> : <ColonnesTable />;
};

export default Game;
