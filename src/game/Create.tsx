import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/User";
import { useWebSocket } from "../hooks/WebSocket";

const Create = () => {
  const { token, userId, isAuthentified, loading: userLoading } = useUser();
  const { socket, isConnected, loading: wbLoading } = useWebSocket()
  const [gameId, setGameId] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('message', (data) => {
        console.log('Received message:', data);
      });

      // Emit an event
      socket.emit('hello', { msg: 'Hello from client!' });
    }

    // Clean up on component unmount
    return () => {
      if (socket) {
        socket.off('message');
      }
    };
  }, [socket, isConnected]);

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
            from: '/create'
          }
        });
      }


    }
  }, [token, isAuthentified, userLoading, navigate]);

  const handleCreateGame = async () => {
    if (socket && isConnected) {
      const response = await fetch(`${process.env.BACKEND_HOST}/game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Success:', data);
        setGameId(data.gameId);
        navigate(`/game/${data.gameId}`);
      } else {
        console.error('Error:', data);
      }
    }
  }

  if (userLoading || wbLoading) {
    // Optionnel : Afficher un loader pendant la vérification de l'authentification
    return <span className="loading loading-ring loading-lg"></span>;
  }

  return (
    <div className="card bg-base-300 flex-1 flex flex-col space-y-4 rounded-box p-5">
      <h1 className="text-2xl">Créez une partie !</h1>
      <h2>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</h2>
      <p>{isConnected && socket?.id}</p>
      <button className="btn btn-warning" onClick={handleCreateGame}>Créer une partie</button>
    </div>
  )
}

export default Create

