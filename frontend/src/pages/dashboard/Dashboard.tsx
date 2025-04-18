import ErrorMessage from "@/components/game/messages/ErrorMessage"
import { useUser } from "@/hooks/User"
import { GameType } from "@/types/types"
import { buildApiUrl } from "@/utils/apiUtils"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const Dashboard = () => {

  const { userId, userName, token, loading: userLoading, isAuthentified } = useUser()
  const navigate = useNavigate();
  const [games, setGames] = useState<GameType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [opponentFilter, setOpponentFilter] = useState<string | null>(null);

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
        const response = await fetch(buildApiUrl(`users/${userId}/games`), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          // tri des parties par date de création descendante
          data.sort((a: GameType, b: GameType) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setGames(data);
          console.log('Games fetched:', data);

        } else {
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

  const handleDeleteGame = async (gameId: string) => {
    if (!token) return;
    // Demande de confirmation
    if (!window.confirm('Voulez-vous vraiment supprimer cette partie ?')) return;
    try {
      const response = await fetch(buildApiUrl(`game/${gameId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Game deleted:', data);
        setGames(games.filter(game => game.id !== gameId));
      } else {
        console.error('Error deleting game:', data);
      }
    } catch (error) {
      console.error('Network error:', error);
      setError("Une erreur réseau s'est produite.");
    }
  };

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

  // statistiques utilisateur
  const victories: number = games.filter(game => game.winner === userId).length;
  const defeats: number = games.filter(game => game.winner && game.winner !== userId).length;
  const finishedGames: number = games.filter(game => game.state === 'finished').length;
  const totalGames: number = games.filter(game => game.creator === userId).length;
  const victoryRate: number = finishedGames ? Math.round((victories / finishedGames) * 100) : 0;
  const totalRounds: number = games.reduce((acc, game) => acc + game.roundNumber, 0);
  const maxRounds: number = games.reduce((acc, game) => Math.max(acc, game.roundNumber), 0);
  // tableau des adversaires du joueur (nombre de parties jouées, nombre de victoires, nombre de défaites, nombre de manches jouées)
  const opponents = games.reduce((acc: { [key: string]: { id: string, username: string, games: number, victories: number, defeats: number, rounds: number } }, game: GameType) => {
    game.players?.forEach(player => {
      if (player.id !== userId) {
        if (!acc[player.id]) {
          acc[player.id] = {
            id: player.id,
            username: player.username,
            games: 0,
            victories: 0,
            defeats: 0,
            rounds: 0
          }
        }
        if (!game.winner) return;
        acc[player.id].games++;
        if (game.winner === player.id) {
          acc[player.id].victories++;
        } else if (game.winner && game.winner !== player.id) {
          acc[player.id].defeats++;
        }
        acc[player.id].rounds += game.roundNumber;
      }
    });
    return acc;
  }, {});

  return (
    <div className="flex-1 flex items-center container mx-auto flex-col px-4 mt-5">
      <div className="stats stats-vertical md:stats-horizontal shadow">
        <div className="stat">
          <div className="stat-figure text-card-negative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>

          </div>
          <div className="stat-title">Parties terminées</div>
          <div className="stat-value text-card-negative">
            {finishedGames}
          </div>
          <div className="stat-desc">
            {/* Nombre de parties créées par le joueur */}
            {
              `${totalGames} parties créées`
            }

          </div>
        </div>

        <div className="stat">

          <div className="stat-title">Manches</div>
          <div className="stat-value text-card-yellow">{totalRounds}</div>
          <div className="stat-desc">
            Record de {maxRounds} sur une partie
          </div>
        </div>

        <div className="stat">
          <div className="stat-figure text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-8 w-8 stroke-current">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div className="stat-title">Victoires</div>
          <div className="stat-value text-green-600">{victories}</div>
          <div className="stat-desc">
            Et {defeats} défaites
          </div>
        </div>

        <div className="stat">
          <div className="stat-figure text-secondary">
            <div className="avatar online placeholder">
              <div className="bg-neutral text-neutral-content w-16 rounded-full">
                <span className="text-xl">{userName?.slice(0, 1)}</span>
              </div>
            </div>
          </div>
          <div className={`stat-value ${victoryRate > 50 ? 'text-green-600' : victoryRate < 50 ? 'text-red-600' : 'text-blue-500'
            }`}>{victoryRate}%</div>
          <div className="stat-title">de victoires</div>
        </div>
      </div>
      {games.length === 0 && (
        <div className="flex-1 flex items-center justify-center flex-col space-y-3">
          <p>Vous n'avez pas encore terminé de partie.</p>
          <p>
            <Link to="/create" className="btn btn-primary ml-4">Créer une partie</Link>
          </p>
        </div>
      )}
      {games.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mt-4">Tes adversaires <span className="text-xs">(Parties terminées)</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 my-4">
            {Object.values(opponents)
              .sort((a, b) => b.games - a.games)
              .filter(opponent => opponent.games > 0)
              .map(opponent => (
                <div
                  key={opponent.id}
                  className={`
                shadow-md rounded-lg p-4 glass w-full text-black cursor-pointer
                ${opponentFilter === opponent.id ? 'bg-red-400' : 'bg-white'}`}
                  onClick={() => {
                    if (opponentFilter === opponent.id) {
                      setOpponentFilter(null);
                      return;
                    }
                    setOpponentFilter(opponent.id);
                  }}
                >
                  <h3 className="text-lg font-bold">{opponent.username}</h3>
                  <p>
                    {`${opponent.games} parties: `}
                    <span className="text-green-600">{opponent.defeats} victoires</span>
                    {opponent.victories > 0 ? ` / ` : ''}
                    {opponent.victories > 0 ? <span className="text-red-600">{opponent.victories} défaites</span> : ''}
                  </p>
                  <p className="text-xs">{opponent.rounds} manches jouées</p>
                </div>
              ))}
          </div>

          <h2 className="text-2xl font-bold mt-4">
            Tes parties
            {opponentFilter && " contre " + opponents[opponentFilter].username}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 my-4">
            {games
              .filter(game => !opponentFilter || game.players?.find(player => player.id === opponentFilter))
              .map((game) => (
                <div key={game.id} className={
                  `${game.winner === userId ? "bg-green-600" : game.winner ? "bg-red-600" : "bg-blue-500"}
              shadow-md rounded-lg p-4 glass w-full text-black
              flex justify-between
              `
                }>
                  <div className="flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg font-bold">
                        {game.winner === userId
                          ? "🥳 Victoire !"
                          : game.winner
                            ? "😭 Défaite"
                            : "🔄 Partie en cours."}
                      </h2>
                      <p>
                        {`${game.players?.length} joueurs: `}
                        {
                          game.players?.map((player, index) => (
                            <span key={player.id}>
                              {player.username}{index < game.players.length - 2 ? ', ' : index === game.players.length - 2 ? ' et ' : ''}
                            </span>
                          ))
                        }
                      </p>
                    </div>
                    <p className="text-xs">{new Date(game.createdAt).toLocaleDateString(
                      'fr-FR'
                    )}
                    </p>
                  </div>
                  <div className="flex flex-col justify-between">
                    <p className="text-center">
                      <span className="text-4xl"><strong>{game.roundNumber}</strong></span><br /> manches
                    </p>
                    <div className="flex space-x-2">
                      {game.state != 'finished' && game.creator === userId && (
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="btn btn-xs btn-error"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>

                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/game/${game.id}`)}
                        className="btn btn-xs btn-neutral"
                      >
                        Consulter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

    </div>
  )
}

export default Dashboard