import ErrorMessage from "@/components/game/messages/ErrorMessage";
import ReconnectMessage from "@/components/game/messages/ReconnectMessage";
import OnlineStatus from "@/components/game/OnlineStatus";
import Rules from "@/components/game/Rules";
import PageSkeleton from "@/components/PageSkeleton";
import PlayerList from "@/components/waiting-room/PlayerList";
import PrivacyBadge from "@/components/waiting-room/PrivacyBadge";
import RoomSettings from "@/components/waiting-room/RoomSettings";
import ShareLink from "@/components/waiting-room/ShareLink";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import { api } from "@/services/apiService";
import type { ErrorType, GameType } from "@/types/types";
import notify from "@/utils/notify";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

const WaitingRoom = () => {
  const { userId, loading: userLoading } = useUser();
  const {
    socket,
    isConnected,
    sendMessage,
    subscribeToEvent,
    unsubscribeFromEvent,
    loading: wsLoading,
  } = useWebSocket();
  const { gameId } = useParams<string>();
  const [game, setGame] = useState<GameType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creationLoading, setCreationLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const isCreator = Boolean(game && game.creator === userId);

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
          if (game?.state === "playing" || game?.state === "finished") {
            // Rediriger vers la page de jeu si la partie a déjà commencé
            navigate(`/game/${gameId}`);
          }
        } else if (response.error) {
          // la partie n'existe pas
          setError("La partie n'existe pas.");
        }
      } catch {
        setError("Une erreur réseau s'est produite.");
      } finally {
        setLoading(false);
      }
    };
    if (!error) getGame();
  }, [gameId, userId, error, setGame, game?.state, navigate]);

  // Cas de l'utilisateur qui rejoint la partie
  useEffect(() => {
    if (loading || userLoading || wsLoading || !gameId || !game || error || !isConnected) return;

    const player = game.players.find((player) => player.id === userId);
    if (!player) {
      if (game.players.length >= game.maxPlayers) {
        navigate("/", {
          state: { message: "La partie est pleine" },
        });
        return;
      }

      const addPlayer = async () => {
        await api.patch(`game/join/${gameId}`, {});
      };
      addPlayer();
      sendMessage("player-joined-game", { room: gameId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, gameId, userId, userLoading, wsLoading, loading, navigate, error, isConnected]); // sendMessage retiré pour éviter les boucles infinies

  // Avertir les autres joueurs de la connexion du joueur
  useEffect(() => {
    if (!gameId || !userId || error || !isConnected) return;
    sendMessage("player-joined-game", { room: gameId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, userId, error, isConnected]); // sendMessage retiré pour éviter les boucles infinies

  // Ecouter les événements de connexion/déconnexion du socket
  useEffect(() => {
    if (!socket || !isConnected || error) return;

    const handlePlayerJoined = async (updatedGame: GameType) => {
      notify("join");
      setGame(updatedGame);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    };

    const handlePlayerLeft = (updatedGame: GameType | ErrorType) => {
      if (typeof updatedGame === "object" && "code" in updatedGame) {
        navigate("/", {
          state: { message: "La partie n'existe plus." },
        });
        return;
      }
      setGame(updatedGame);
    };

    const handleStartGame = (updatedGame: GameType) => {
      setGame(updatedGame);
      navigate(`/game/${gameId}`);
    };

    subscribeToEvent("player-joined-game", handlePlayerJoined);
    subscribeToEvent("player-left-game", handlePlayerLeft);
    subscribeToEvent("update-game-params", setGame);
    subscribeToEvent("start-game", handleStartGame);

    return () => {
      unsubscribeFromEvent("player-joined-game", handlePlayerJoined);
      unsubscribeFromEvent("player-left-game", handlePlayerLeft);
      unsubscribeFromEvent("update-game-params", setGame);
      unsubscribeFromEvent("start-game", handleStartGame);
    };
  }, [socket, isConnected, subscribeToEvent, unsubscribeFromEvent, navigate, error, gameId, setGame]);

  const handleSwitchPrivate = async () => {
    if (!isCreator || !game) return;
    const updatedGame = { ...game, private: !game.private };
    setGame(updatedGame);
    await api.patch(`game/${gameId}`, { private: !game.private });

    // avertir les autres joueurs du changement
    sendMessage("update-game-params", { room: gameId });
  };

  // Mettre à jour le nombre de joueurs max
  const handleChangeMaxPlayers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCreator || !game) return;
    const value = parseInt(e.target.value);
    // Mettre à jour le nombre de joueurs max dans la base de données
    await api.patch(`game/${gameId}`, { maxPlayers: value });
    // avertir les autres joueurs du changement
    sendMessage("update-game-params", { room: gameId });
  };

  const handleStartGame = () => {
    setCreationLoading(true);
    if (!isCreator || !game) return;
    sendMessage("start-game", { room: gameId });

    // cas où le start-game échoue coté serveur
    setTimeout(() => {
      setCreationLoading(false);
    }, 5000);
  };

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

  if (loading || userLoading || !game) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex-1 flex items-center container mx-auto">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 py-6 min-h-[50vh]">
        <div className="panel col-span-3 lg:col-span-2 flex flex-col space-y-4 p-5 sm:p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold">Salle d'attente</h1>
            <PrivacyBadge isPrivate={game.private} onToggle={handleSwitchPrivate} />
          </div>
          {!isCreator && <p>Salon créé par {game.creatorPlayer.username}</p>}
          <div className="divider"></div>
          <h3 className="text-xl font-semibold">Partage ce lien à tes amis</h3>
          <ShareLink gameId={game.id} />
          {isCreator && (
            <RoomSettings
              game={game}
              starting={creationLoading}
              onChangeMaxPlayers={handleChangeMaxPlayers}
              onStart={handleStartGame}
            />
          )}
        </div>
        <div className="panel col-span-3 lg:col-span-1 flex flex-col space-y-4 p-5 sm:p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold tabular-nums">
              Joueurs {game?.players.length}/{game?.maxPlayers}
            </h2>
            <OnlineStatus isConnected={isConnected} />
          </div>
          <div className="divider"></div>
          <div>
            <p className="text-muted">
              {game.players.length === game.maxPlayers
                ? "La partie va bientôt commencer..."
                : "En attente de joueurs..."}
            </p>
          </div>
          <PlayerList game={game} />
        </div>
        <div className="col-span-3">
          <Rules />
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
