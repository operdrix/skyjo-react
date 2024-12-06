import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OnlineStatus from "../components/game/OnlineStatus";
import { useUser } from "../hooks/User";
import { useWebSocket } from "../hooks/WebSocket";

type GameType = {
  id: string,
  players: Array<{
    id: string,
    username: string,
    game_players: undefined
  }>,
  state: string,
  private: boolean,
  createdAt: string,
  creator: string,
  roundNumber: number,
  updatedAt: string,
  winner: string,
  winnerScore: number,
  maxPlayers: number,
  creatorPlayer: {
    id: string,
    username: string
  }
}

const WaitingRoom = () => {
  const { token, userId, loading: userLoading } = useUser();
  const { socket, isConnected, sendMessage, subscribeToEvent, unsubscribeFromEvent, loading: wsLoading } = useWebSocket()
  const { gameId } = useParams<string>();
  const [game, setGame] = useState<GameType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const navigate = useNavigate();

  // Rediriger vers la création de partie si gameId n'est pas défini dans l'URL

  useEffect(() => {
    if (!gameId) {
      navigate("/game/create");
    }
  }, [gameId, navigate]);

  //Récupérer les informations de la partie
  const getGame = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.BACKEND_HOST}/game/${gameId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setGame(data);
        if (data.creator === userId) {
          setIsCreator(true);
        }
      } else {
        console.error('Error fetching game:', data);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId, token, userId]);

  // Appeler getGame au montage du composant
  useEffect(() => {
    getGame();
  }, [getGame]);

  // Écouter l'événement "player-joined-game" et mettre à jour l'état
  useEffect(() => {
    if (!socket || !isConnected) return;
    console.log('useEffect 1');

    const handlePlayerJoined = (updatedGame: GameType) => {
      console.log("Player joined game:", updatedGame);
      setGame(updatedGame);
    };

    subscribeToEvent("player-joined-game", handlePlayerJoined);

    return () => {
      unsubscribeFromEvent("player-joined-game", handlePlayerJoined);
    };

  }, [socket, isConnected, subscribeToEvent, unsubscribeFromEvent]);

  // rejoindre si on n'est pas déjà dans la liste des joueurs
  useEffect(() => {
    if (loading || userLoading || wsLoading || !gameId || !game) return;

    console.log('useEffect 2', game.players);

    const player = game.players.find((p) => p.id === userId);
    if (!player) {
      sendMessage("player-joined-game", { room: gameId, userId });
    }

  }, [game, gameId, userId, sendMessage, userLoading, wsLoading, loading]);

  const handleCopyToClipboard = () => {
    const url = `${window.location.origin}/game/${gameId}`;
    navigator.clipboard.writeText(url);
  }

  const handleChangeMaxPlayers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCreator || !game) return;
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
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-5">
      <div className="bg-base-300 lg:col-span-2 flex flex-col space-y-4 rounded-box p-5">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl">Salle d'attente</h1>
          {game?.private ?
            <div
              className="tooltip tooltip-top cursor-help"
              data-tip='Seuls les joueurs ayant l&apos;URL peuvent rejoindre ce salon'
            >
              <div className='badge badge-neutral gap-2'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Salon privé
              </div>
            </div>
            :
            <div
              className="tooltip tooltip-top cursor-help"
              data-tip='Salon visible dans la liste des salons publics'
            >
              <div className='badge badge-accent gap-2'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Salon public
              </div>
            </div>
          }
        </div>
        {!isCreator &&
          <p>Salon créé par {game?.creatorPlayer.username}</p>
        }
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
        {isCreator &&
          <>
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
          </>
        }
      </div>
      <div className="bg-base-300 flex flex-col space-y-4 rounded-box p-5">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl">Joueurs {game?.players.length}/{game?.maxPlayers}</h2>
          <OnlineStatus isConnected={isConnected} sockerId={socket?.id} />
        </div>
        <div className="divider"></div>
        <ul className="flex flex-col space-y-2">
          {game?.players.map((player, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="avatar online placeholder">
                <div className="bg-neutral text-neutral-content w-12 rounded-full">
                  <span className="text-xl">{player?.username.charAt(0)}</span>
                </div>
              </div>
              <div>
                <h2 className="text-lg">{player?.username}</h2>
                <p className="text-sm text-gray-500">En attente</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default WaitingRoom