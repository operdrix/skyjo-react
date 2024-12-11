import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../../hooks/User";
import { useWebSocket } from "../../hooks/WebSocket";

type GameType = {
  id: string,
  players: Array<undefined>,
  state: string,
  private: boolean,
  createdAt: string,
  creator: string,
  roundNumber: number,
  updatedAt: string,
  winner: string,
  winnerScore: number,
  maxPlayers: number,
}

const Game = () => {
  const { token, isAuthentified, loading: userLoading } = useUser();
  const { socket, isConnected } = useWebSocket()
  const { gameId } = useParams();
  const [game, setGame] = useState<GameType>(
    {
      id: '',
      players: [],
      state: '',
      private: false,
      createdAt: '',
      creator: '',
      roundNumber: 0,
      updatedAt: '',
      winner: '',
      winnerScore: 0,
      maxPlayers: 3
    });
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté au WebSocket
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

  // Vérifier si l'utilisateur est connecté au site
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
            from: window.location.pathname
          }
        });
      }
    }
  }, [token, isAuthentified, userLoading, navigate]);

  // Vérifie le statut de la partie
  const getGame = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`${process.env.BACKEND_HOST}/game/${gameId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok) {
      setGame(data);
    } else {
      console.error('Error:', data);
    }
    setLoading(false);
  }, [gameId, token]);

  useEffect(() => {
    if (gameId) {
      getGame()
      if (game.state === 'pending') {
        navigate(`/game/${gameId}/waiting`)
      }
    }
  }, [gameId, getGame, navigate, game]);


  return (
    <div>Salle de jeu</div>
  )
}

export default Game