import GameHistoryCard from "@/components/dashboard/GameHistoryCard";
import OpponentCard from "@/components/dashboard/OpponentCard";
import StatsBar from "@/components/dashboard/StatsBar";
import ErrorMessage from "@/components/game/messages/ErrorMessage";
import PageSkeleton from "@/components/PageSkeleton";
import { opponentStats, playerStats } from "@/game/stats";
import { useUser } from "@/hooks/User";
import { api } from "@/services/apiService";
import { GameType } from "@/types/types";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

const Dashboard = () => {
  const { userId, userName, loading: userLoading, isAuthentified } = useUser();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [opponentFilter, setOpponentFilter] = useState<string | null>(null);

  // Vérifier si l'utilisateur est connecté au site
  useEffect(() => {
    if (!userLoading && !isAuthentified) {
      navigate("/auth/login", {
        state: {
          message: {
            type: "info",
            message: "Vous devez être connecté pour accéder à cette page",
            title: "Connexion requise",
          },
          from: window.location.pathname,
        },
      });
    }
  }, [isAuthentified, navigate, userLoading]);

  useEffect(() => {
    if (!userId) return;

    const getGames = async () => {
      setLoading(true);

      const response = await api.get(`users/${userId}/games`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        // tri des parties par date de création descendante
        response.data.sort((a: GameType, b: GameType) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setGames(response.data);
      }

      setLoading(false);
    };

    if (!error) getGames();
  }, [userId, error]);

  const handleDeleteGame = async (gameId: string) => {
    // Demande de confirmation
    if (!window.confirm("Voulez-vous vraiment supprimer cette partie ?")) return;

    const response = await api.delete(`game/${gameId}`);

    if (response.error) {
      setError(response.error);
    } else {
      setGames(games.filter((game) => game.id !== gameId));
    }
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

  if (loading || userLoading || !games) {
    return <PageSkeleton />;
  }

  const stats = playerStats(games, userId!);
  const opponents = opponentStats(games, userId!);
  const filteredOpponent = opponents.find((opponent) => opponent.id === opponentFilter);

  return (
    <div className="flex-1 flex items-center container mx-auto flex-col px-4 mt-5">
      <StatsBar stats={stats} userName={userName} />
      {games.length === 0 && (
        <div className="flex-1 flex items-center justify-center flex-col space-y-3">
          <p>Vous n'avez pas encore terminé de partie.</p>
          <p>
            <Link to="/create" className="btn btn-primary ml-4">
              Créer une partie
            </Link>
          </p>
        </div>
      )}
      {games.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mt-4">
            Tes adversaires <span className="text-xs">(Parties terminées)</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 my-4">
            {opponents.map((opponent) => (
              <OpponentCard
                key={opponent.id}
                opponent={opponent}
                selected={opponentFilter === opponent.id}
                onSelect={() => setOpponentFilter(opponentFilter === opponent.id ? null : opponent.id)}
              />
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-4">
            Tes parties
            {filteredOpponent && " contre " + filteredOpponent.username}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-4">
            {games
              .filter((game) => !opponentFilter || game.players?.find((player) => player.id === opponentFilter))
              .map((game) => (
                <GameHistoryCard key={game.id} game={game} userId={userId} onDelete={handleDeleteGame} />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
