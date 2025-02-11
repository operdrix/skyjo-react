import ErrorMessage from "@/components/game/messages/ErrorMessage";
import ReconnectMessage from "@/components/game/messages/ReconnectMessage";
import OnlineStatus from "@/components/game/OnlineStatus";
import Rules from "@/components/game/Rules";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import type { ErrorType, GameType } from "@/types/types";
import notify from "@/utils/notify";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const WaitingRoom = () => {
  const { token, userId, loading: userLoading } = useUser();
  const { socket, isConnected, sendMessage, subscribeToEvent, unsubscribeFromEvent, loading: wsLoading } = useWebSocket()
  const { gameId } = useParams<string>();
  const [game, setGame] = useState<GameType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [creationLoading, setCreationLoading] = useState<boolean>(false);
  const [validateCopy, setValidateCopy] = useState<boolean>(false);
  const navigate = useNavigate();

  // Rediriger vers la création de partie si gameId n'est pas défini dans l'URL
  useEffect(() => {
    if (!gameId) {
      navigate("/game/create");
    }
  }, [gameId, navigate]);

  //On récupère les informations de la partie
  useEffect(() => {
    if (!gameId || !token || !userId) return;
    console.log('récupération de la partie', gameId);

    const getGame = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.VITE_BACKEND_HOST}/game/${gameId}`, {
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
          if (game?.state === 'playing' || game?.state === 'finished') {
            // Rediriger vers la page de jeu si la partie a déjà commencé
            navigate(`/game/${gameId}`);
          }
        } else {
          // la partie n'existe pas
          console.error('Error fetching game:', data);
          setError("La partie n'existe pas.");
        }
      } catch (error) {
        console.error('Network error:', error);
        setError("Une erreur réseau s'est produite.");
      } finally {
        setLoading(false);
      }
    };
    if (!error) getGame();
  }, [gameId, token, userId, error, setGame, game?.state, navigate]);

  // Cas de l'utilisateur qui rejoint la partie
  useEffect(() => {
    if (loading || userLoading || wsLoading || !gameId || !game || !token || error) return;

    console.log('rejoindre partie', userId);

    const player = game.players.find((player) => player.id === userId);
    if (!player) {
      if (game.players.length >= game.maxPlayers) {
        navigate('/', {
          state: { message: "La partie est pleine" }
        });
        return;
      }
      console.log('ajout nouveau du joueur à la partie');

      const addPlayer = async () => {
        await fetch(`${process.env.VITE_BACKEND_HOST}/game/join/${gameId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        });
      }
      addPlayer();
      sendMessage("player-joined-game", { room: gameId, userId });
    }
  }, [game, gameId, userId, sendMessage, userLoading, wsLoading, loading, navigate, token, error]);

  // Avertir les autres joueurs de la connexion du joueur
  useEffect(() => {
    if (!gameId || !userId || error) return;
    sendMessage("player-joined-game", { room: gameId, userId });
  }, [gameId, userId, sendMessage, error]);

  // Ecouter les événements de connexion/déconnexion du socket
  useEffect(() => {
    if (!socket || !isConnected || error) return;

    const handlePlayerJoined = async (updatedGame: GameType) => {
      console.log("Player joined game:", updatedGame);
      notify('join');
      setGame(updatedGame);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    };

    const handlePlayerLeft = (updatedGame: GameType | ErrorType) => {
      if (typeof updatedGame === 'object' && 'code' in updatedGame) {
        navigate('/', {
          state: { message: "La partie n'existe plus." }
        });
        return;
      }
      console.log("Player left game:", updatedGame);
      setGame(updatedGame);
    }

    const handleStartGame = (updatedGame: GameType) => {
      console.log("Game started:", updatedGame);
      navigate(`/game/${gameId}`);
    }

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
    await fetch(`${process.env.VITE_BACKEND_HOST}/game/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ private: !game.private }),
    });

    // avertir les autres joueurs du changement
    sendMessage("update-game-params", { room: gameId });
  }

  // copie de l'url du jeu dans le presse-papier
  const handleCopyToClipboard = () => {
    const url = `${window.location.origin}/join/${gameId}`;
    navigator.clipboard.writeText(url);
    setValidateCopy(true);
    setTimeout(() => {
      setValidateCopy(false);
    }, 2000);
  }

  // Mettre à jour le nombre de joueurs max
  const handleChangeMaxPlayers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCreator || !game) return;
    const value = parseInt(e.target.value);
    // Mettre à jour le nombre de joueurs max dans la base de données
    await fetch(`${process.env.VITE_BACKEND_HOST}/game/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ maxPlayers: value }),
    });
    // avertir les autres joueurs du changement
    sendMessage("update-game-params", { room: gameId });
  }

  const handleStartGame = () => {
    setCreationLoading(true);
    if (!isCreator || !game) return;
    sendMessage("start-game", { room: gameId });

    // cas où le start-game échoue coté serveur
    setTimeout(() => {
      setCreationLoading(false);
    }, 5000);
  }

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

  if (wsLoading || !isConnected) {
    return <ReconnectMessage />
  }

  if (loading || userLoading || !game) {
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-5 min-h-[50vh]">
        <div className="bg-base-300 lg:col-span-2 flex flex-col space-y-4 rounded-box p-5">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl text-title">Salle d'attente</h1>
            {game.private ?
              <div
                className="tooltip tooltip-top cursor-pointer"
                data-tip='Seuls les joueurs ayant l&apos;URL peuvent rejoindre ce salon'
              >
                <div
                  className='badge badge-neutral gap-2'
                  onClick={handleSwitchPrivate}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  Salon privé
                </div>
              </div>
              :
              <div
                className="tooltip tooltip-top cursor-pointer"
                data-tip='Salon visible dans la liste des salons publics'
              >
                <div
                  className='badge badge-accent gap-2'
                  onClick={handleSwitchPrivate}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  Salon public
                </div>
              </div>
            }
          </div>
          {!isCreator &&
            <p>Salon créé par {game.creatorPlayer.username}</p>
          }
          <div className="divider"></div>
          <h3 className="text-xl">Partage cet URL à tes amis</h3>
          <div className="flex">
            <label className="input input-bordered flex items-center gap-2 flex-1 mr-2">
              Lien
              <input
                type="text"
                className="grow"
                placeholder="http://"
                value={`${window.location.origin}/join/${gameId}`}
                readOnly
              />
            </label>
            <div className={`tooltip ${validateCopy && 'tooltip-success'}`} data-tip={validateCopy ? 'Copié !' : 'Copier dans le presse-papier'}>
              <label className={`btn btn-square swap swap-rotate ${validateCopy && 'swap-active'}`} onClick={handleCopyToClipboard}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="swap-off size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="swap-on size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </label>
            </div>
          </div>
          {isCreator && game &&
            <>
              <div className="divider"></div>
              <h3 className="text-xl">Paramètres de jeu</h3>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <span>Nombre de joueurs max</span>
                  <div>
                    <input
                      type="range"
                      min={Math.max(2, game.players.length)}
                      max="4"
                      defaultValue={game.maxPlayers || 4}
                      className="range"
                      step="1"
                      onChange={handleChangeMaxPlayers}
                    />
                    <div className="flex w-full justify-between px-2 text-xs">
                      {game.players.length <= 2 && <span>2</span>}
                      {game.players.length <= 3 && <span>3</span>}
                      <span>4</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-end justify-center">
                <button
                  className="btn btn-neutral bg-card-red border-card-red text-base-100 text-xl w-full"
                  onClick={handleStartGame}
                  disabled={game.players.length < 2 || creationLoading}
                >
                  👾 Commencer la partie 👾
                  {creationLoading &&
                    <span className="loading loading-spinner loading-sm"></span>
                  }
                </button>
              </div>
            </>
          }
        </div>
        <div className="bg-base-300 flex flex-col space-y-4 rounded-box p-5">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl">Joueurs {game?.players.length}/{game?.maxPlayers}</h2>
            <OnlineStatus isConnected={isConnected} />
          </div>
          <div className="divider"></div>
          <div>
            <p className="mt-4">
              {game.players.length === game.maxPlayers ? "La partie va bientôt commencer..." : "En attente de joueurs..."}
            </p>
          </div>
          <ul className="flex flex-wrap gap-4">
            {game?.players.map((player, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="avatar online placeholder">
                  <div className="bg-neutral text-neutral-content w-12 mask mask-squircle">
                    <span className="text-xl">{player?.username.charAt(0)}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg">{player?.username}</h2>
                  {player.id === game.creatorPlayer.id && <p className="text-sm text-gray-500">Créateur de la partie</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-3">
          <Rules />
        </div>
      </div>

    </div>
  )
}

export default WaitingRoom