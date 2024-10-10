import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OnlineStatus from "../components/game/OnlineStatus";
import { useUser } from "../hooks/User";
import { useWebSocket } from "../hooks/WebSocket";

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

const Waiting = () => {
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
            from: '/game/create'
          }
        });
      }
    }
  }, [token, isAuthentified, userLoading, navigate]);

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
    }
  }, [gameId, getGame]);

  const handleCopyToClipboard = () => {
    const url = `${window.location.origin}/game/${gameId}`;
    navigator.clipboard.writeText(url);
  }

  const handleChangeMaxPlayers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setGame({
      ...game,
      maxPlayers: value
    });
    fetch(`${process.env.BACKEND_HOST}/game/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ maxPlayers: value }),
    });

  }

  const handleStartGame = () => {
  }

  if (loading) {
    return (
      <div className="flex-1 grid grid-cols-3 gap-4 p-5">
        <h1>Chargement en cours</h1>
        <span className="loading loading-lg"></span>
      </div>
    )
  }


  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
      <div className="bg-base-300 md:col-span-2 flex flex-col space-y-4 rounded-box p-5">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl">Salle d'attente</h1>
          <div
            className="tooltip tooltip-top cursor-help"
            data-tip={!game?.private && 'Salon visible dans la liste des salons publics'}
          >
            <div className={`badge ${game?.private ? 'badge-neutral' : 'badge-accent'} `}>
              Salon {game?.private ? "privé" : "public"}
            </div>
          </div>
        </div>
        <div className="divider"></div>
        <div className="flex">
          <label className="input input-bordered flex items-center gap-2 flex-1 mr-2">
            Partage cet URL
            <input
              type="text"
              className="grow"
              placeholder="http://"
              value={`${window.location.origin}/game/${gameId}`}
              readOnly
            />
          </label>
          <div className="tooltip" data-tip="Copier l'url">
            <button className="btn btn-square" onClick={handleCopyToClipboard}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <p>En attente de joueurs...</p>
        </div>
        <div className="divider"></div>
        <h3 className="text-xl">Paramètres de jeu</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between">
            <span>Nombre de joueurs max</span>
            <div>
              <input
                type="range"
                min={2} max="4"
                defaultValue={game?.maxPlayers || 3}
                className="range"
                step="1"
                onChange={handleChangeMaxPlayers}
              />
              <div className="flex w-full justify-between px-2 text-xs">
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-warning text-xl" onClick={handleStartGame}>👾 Commencer la partie 👾</button>
      </div>
      <div className="bg-base-300 flex flex-col space-y-4 rounded-box p-5">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl">Joueurs</h2>
          <OnlineStatus isConnected={isConnected} sockerId={socket?.id} />
        </div>
        <div className="divider"></div>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <div className="avatar online placeholder">
              <div className="bg-neutral text-neutral-content w-12 rounded-full">
                <span className="text-xl">A</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg">Alice</h2>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="avatar online placeholder">
              <div className="bg-neutral text-neutral-content w-12 rounded-full">
                <span className="text-xl">B</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg">Bob</h2>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Waiting