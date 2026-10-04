import ErrorMessage from "@/components/game/messages/ErrorMessage";
import PageSkeleton from "@/components/PageSkeleton";
import { useUser } from "@/hooks/User";
import { api } from "@/services/apiService";
import { GameType } from "@/types/types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const JoinPublic = () => {
  const { userId, loading: userLoading } = useUser();
  const [games, setGames] = useState<GameType[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [reload, setReload] = useState<number>(0);

  // Chargement des parties publiques en attente (rechargées via le bouton)
  useEffect(() => {
    if (!userId) return;
    let active = true;
    api.get("games?state=pending&privateRoom=false").then((response) => {
      if (!active) return;
      if (response.data) {
        setGames(response.data);
      } else {
        setError(response.code === 500 ? "Une erreur réseau s'est produite." : "La partie n'existe pas.");
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId, reload]);

  if (loading || userLoading || !games) {
    return <PageSkeleton />;
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
    <div className="flex flex-1 items-center px-4 py-6">
      <div className="panel relative mx-auto flex w-full max-w-5xl flex-col justify-between p-5 min-h-[40vh]">
        <button
          className="absolute right-0 top-0 btn btn-ghost m-2"
          onClick={() => {
            setLoading(true);
            setError(null);
            setReload((count) => count + 1);
          }}
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
                {games
                  .filter((game) => game.players.length < game.maxPlayers && game.players.length > 0)
                  .map((game) => (
                    <tr key={game.id}>
                      <td>{game.id}</td>
                      <td>{game.creatorPlayer.username}</td>
                      <td>
                        {game.players.length}/{game.maxPlayers}
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/join/${game.id}`)}>
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
