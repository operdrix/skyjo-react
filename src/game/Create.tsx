import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnlineStatus from "../components/game/OnlineStatus";
import { useUser } from "../hooks/User";
import { useWebSocket } from "../hooks/WebSocket";

const Create = () => {
  const { token, userId, isAuthentified, loading: userLoading } = useUser();
  const { socket, isConnected, loading: wbLoading } = useWebSocket()
  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [privateRoom, setPrivateRoom] = useState<boolean>(false);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!userLoading) { // Attendre que le chargement soit terminé avant de vérifier l'authentification
      if (!isAuthentified) {
        navigate('/auth/login', {
          state: {
            message: {
              type: 'error',
              message: 'Vous devez être connecté pour accéder à cette page',
              title: 'Connexion requise'
            },
            from: '/game/create'
          }
        });
      }
    }
  }, [token, isAuthentified, userLoading, navigate]);

  useEffect(() => {
    if (gameId) {
      navigate(`/game/${gameId}/waiting`)
    }
  }, [gameId, navigate, privateRoom]);

  const handleCreateGame = async (privateRoom: boolean) => {
    setLoading(true);
    if (socket && isConnected) {
      const response = await fetch(`${process.env.BACKEND_HOST}/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userId, privateRoom: privateRoom }),
      });
      const data = await response.json();
      if (response.ok) {
        setPrivateRoom(privateRoom);
        setGameId(data.gameId);
      } else {
        console.error('Error:', data);
        setLoading(false);
      }
    }
    setLoading(false);
  }

  if (userLoading || wbLoading) {
    // Optionnel : Afficher un loader pendant la vérification de l'authentification
    return <span className="loading loading-ring loading-lg"></span>;
  }

  return (
    <div className="bg-base-300 flex-1 flex flex-col space-y-4 rounded-box p-5">
      <div className="flex flex-row-reverse">
        <OnlineStatus isConnected={isConnected} sockerId={socket?.id} className="absolute" />
      </div>
      <h1 className="text-2xl">Créez une partie !</h1>
      <p>
        Vous êtes prêt à jouer ? Cliquez sur le bouton ci-dessous pour créer une partie et inviter vos amis à vous rejoindre.
      </p>
      <p>
        Vous pourrez commencer la partie dès que tous les joueurs seront prêts.
      </p>
      <div className="flex justify-center gap-3">
        <button
          className="btn btn-primary text-xl flex-1"
          disabled={loading}
          onClick={() => handleCreateGame(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <span className="inline-block mr-2">Créer une partie privée</span>
          {loading &&
            <span className="loading loading-ring loading-sm align-middle"></span>
          }
        </button>
        <button
          className="btn btn-secondary text-xl flex-1"
          disabled={loading}
          onClick={() => handleCreateGame(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <span className="inline-block mr-2">Créer une partie publique</span>
          {loading &&
            <span className="loading loading-ring loading-sm align-middle"></span>
          }
        </button>
      </div>

    </div>
  )
}

export default Create

