import ErrorMessage from "@/components/game/messages/ErrorMessage"
import { useUser } from "@/hooks/User"
import { GameType } from "@/types/types"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const Dashboard = () => {

  const { userId, token, loading: userLoading, isAuthentified } = useUser()
  const navigate = useNavigate();
  const [games, setGames] = useState<GameType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  // Vérifier si l'utilisateur est connecté au site
  useEffect(() => {
    if (!userLoading && !isAuthentified) {
      console.log('Game Layout: User not authentified');
      navigate('/auth/login', {
        state: {
          message: {
            type: 'info',
            message: 'Vous devez être connecté pour accéder à cette page', // + window.location.pathname,
            title: 'Connexion requise'
          },
          from: window.location.pathname
        }
      });
    }
  }, [isAuthentified, navigate, userLoading]);

  useEffect(() => {
    if (!userId || !token) return;

    const getGames = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.VITE_BACKEND_HOST}/games?creatorId=${userId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setGames(data);
        } else {
          // la partie n'existe pas
          console.error('Error fetching games:', data);
        }
      } catch (error) {
        console.error('Network error:', error);
        setError("Une erreur réseau s'est produite.");
      } finally {
        setLoading(false);
      }
    };
    if (!error) getGames();
  }, [token, userId, error]);

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
    )
  }

  return (
    <div className="flex-1 flex items-center container mx-auto">
      {games.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-5">
          {games.map((game) => (
            <div key={game.id} className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-lg font-bold">{game.id}</h2>
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/game/${game.id}`)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Jouer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p>Vous n'avez pas encore créé de jeu.</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard