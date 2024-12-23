import ErrorMessage from "@/components/game/messages/ErrorMessage";
import { useUser } from "@/hooks/User";
import { GameType } from "@/types/types";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinPublic = () => {
  const { token, userId, loading: userLoading } = useUser();
  const [games, setGames] = useState<GameType[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchGames = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      const response = await fetch(`${process.env.VITE_BACKEND_HOST}/games?state=pending&privateRoom=false`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setGames(data);
      } else {
        console.error("Error fetching game:", data);
        setError("La partie n'existe pas.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Une erreur réseau s'est produite.");
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  if (loading || userLoading || !games) {
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
    );
  }

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

  return (
    <div className="flex-1 flex items-center">
      <div className="container relative mx-auto bg-base-300 flex flex-col justify-between sm:rounded-box p-5 min-h-[40vh]">
        <button
          className="absolute right-0 top-0 btn btn-ghost m-2"
          onClick={fetchGames} // Directly call the fetchGames function on button click
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
        <div className="flex-1 flex flex-col items-center gap-4">
          <h1 className="text-4xl">Rejoindre une partie publique !</h1>
          <p>Ils n'attendent que vous !</p>
          <div className="flex-1 flex overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Partie</th>
                  <th>Créateur</th>
                  <th>Places</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game.id}>
                    <td>{game.id}</td>
                    <td>{game.creatorPlayer.username}</td>
                    <td>{game.players.length}/{game.maxPlayers}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/join/${game.id}`)}
                      >
                        Rejoindre
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinPublic;
