import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../../components/game/messages/ErrorMessage";
import ReconnectMessage from "../../components/game/messages/ReconnectMessage";
import { useGame } from "../../hooks/Game";
import { useUser } from "../../hooks/User";
import { useWebSocket } from "../../hooks/WebSocket";
import type { Card, GameData, GameType } from "../../types/types";

const Game = () => {
  const { token, userId, loading: userLoading } = useUser();
  const { socket, isConnected, sendMessage, subscribeToEvent, unsubscribeFromEvent, loading: wsLoading } = useWebSocket()
  const { game, setGame } = useGame();
  const { gameId } = useParams<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
            //setIsCreator(true);
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
  }, [gameId, token, userId, error, setGame]);

  // Rediriger vers la salle d'attente si la partie est en attente de joueurs
  useEffect(() => {
    if (!game) return;

    if (game.state === 'pending') {
      navigate(`/join/${gameId}`);
    }

  }, [game, navigate, gameId]);

  // Avertir les autres joueurs de la connexion du joueur
  useEffect(() => {
    if (!gameId || !userId || error) return;
    sendMessage("player-joined-game", { room: gameId, userId });
  }, [gameId, userId, sendMessage, error]);

  // souscriptions aux événements
  useEffect(() => {
    if (!socket || !isConnected || error) return;

    const handlePlayerJoined = (updatedGame: GameType) => {
      console.log("Player joined game:", updatedGame);
      setGame(updatedGame);
    };

    const handlePlayerLeft = (updatedGame: GameType) => {
      console.log("Player left game:", updatedGame);
      setGame(updatedGame);
    }

    const handlePlayMove = (updatedGameData: GameData) => {
      console.log("Play move:", updatedGameData);
      if (!game) return;
      setGame({ ...game, gameData: updatedGameData });
    }

    subscribeToEvent("player-joined-game", handlePlayerJoined);
    subscribeToEvent("player-left-game", handlePlayerLeft);
    subscribeToEvent("update-game-params", setGame);
    subscribeToEvent("play-move", handlePlayMove);

    return () => {
      unsubscribeFromEvent("player-joined-game", handlePlayerJoined);
      unsubscribeFromEvent("player-left-game", handlePlayerLeft);
      unsubscribeFromEvent("update-game-params", setGame);
      unsubscribeFromEvent("play-move", handlePlayMove);
    };

  }, [socket, isConnected, gameId, subscribeToEvent, unsubscribeFromEvent, error, setGame, game]);

  if (wsLoading || !isConnected) {
    return <ReconnectMessage />
  }

  if (loading || userLoading || !game || !userId) {
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

  // Assignation des identifiants des joueurs aux positions de la table
  const playerIndex = game.gameData.turnOrder.indexOf(userId);
  let playerIdTop = '';
  let playerIdLeft = '';
  let playerIdRight = '';

  const playerCount = game.players.length;
  const turnOrder = game.gameData.turnOrder;
  const positions = ["Top", "Left", "Right"];

  positions.forEach((position, index) => {
    if (playerCount > index + 1) {
      const playerId = turnOrder[(playerIndex + index + 1) % playerCount];
      if (position === "Top") playerIdTop = playerId;
      if (position === "Left") playerIdLeft = playerId;
      if (position === "Right") playerIdRight = playerId;
    }
  });

  return (
    <>
      {/* <pre>
        {JSON.stringify(game, null, 2)}
      </pre> */}
      <section className="md:container md:mx-auto w-full grow grid grid-cols-3 gap-4">
        {/* Ligne 1 : joueur d'en face */}

        <div></div>
        <PlayerSet playerId={playerIdTop} />
        <div></div>

        {/* Ligne 2 */}

        {/* Joueur à gauche */}
        {game.players.length >= 3 ? <PlayerSet playerId={playerIdLeft} /> : <div></div>}

        {/* Zone de pioche et défausse */}
        <div className="flex justify-center items-center h-full min-h-48 gap-9">
          <GameCard disabled isDiscard card={game.gameData.discardPile[game.gameData.discardPile.length - 1]} />
          <GameCard disabled isDeck card={game.gameData.deckCards[0]} />
        </div>

        {/* Joueur à droite */}
        {game.players.length === 4 ? <PlayerSet playerId={playerIdRight} /> : <div></div>}

        {/* Ligne 3 : jour actuel */}

        <div></div>
        <PlayerSet playerId={userId} isCurrentPlayer />
        <div></div>

      </section>
    </>
  )
}

const PlayerSet = ({ playerId, isCurrentPlayer = false }: {
  playerId: string;
  isCurrentPlayer?: boolean;
}) => {

  const { game } = useGame();
  const { userId } = useUser();
  const { sendMessage } = useWebSocket();

  // useEffect(() => {
  //   if (!game || !userId) return;

  //   if (!isCurrentPlayer) {
  //     // Si la carte n'appartient pas au joueur actuel, à la pioche ou à la défausse, on la désactive
  //     setDisabled(true);
  //   } else if (game.gameData.currentStep === 'initialReveal' && !isDeck && !isDiscard && isCurrentPlayer) {
  //     // Si c'est le tour du joueur actuel et que c'est l'étape de révélation initiale, on active les cartes du joueur pour qu'il en révèle deux
  //     if (revealedCards() >= 2) {
  //       setDisabled(true);
  //     } else {
  //       setDisabled(false);
  //     }
  //   }
  // }, [game, isDeck, isDiscard, userId, isCurrentPlayer, revealedCards]);

  if (!game || !userId) return null;
  if (!game.gameData) return null;

  const playerCards = game.gameData.playersCards[playerId];
  const player = game.players.find(player => player.id === playerId);
  const revealedCards = () => {
    if (!game || !userId) return 0;
    const playerCards = game.gameData.playersCards[userId];
    return playerCards.filter(card => card.revealed).length;
  };

  const handleClick = (cardId: string) => {

    if (isCurrentPlayer && game.gameData.currentStep === 'initialReveal') {
      // Révéler la carte cliquée par le joueur actuel dans la limite de deux cartes
      if (revealedCards() <= 1) {
        const cardIndex = playerCards.findIndex((c) => c.id === cardId);
        game.gameData.playersCards[userId][cardIndex].revealed = true;
      }

      console.log('Cartes révélées:', game.gameData.playersCards[userId]);

      // Envoyer un message pour révéler la carte
      sendMessage("play-move", { room: game.id, gameData: game.gameData });
    }
  }

  return (
    <div className="flex flex-col justify-center items-center h-full min-h-48">
      <h2 className="text-xl font-bold mb-2">{player?.username}</h2>
      <div className={`grid gap-2 ${playerCards.length === 12 ? 'grid-cols-4' : playerCards.length === 9 ? 'grid-cols-3' : playerCards.length === 6 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {playerCards.map((card) => {

          let disabled = false;
          if (!isCurrentPlayer) {
            // Si la carte n'appartient pas au joueur actuel, à la pioche ou à la défausse, on la désactive
            disabled = true;
          } else if (game.gameData.currentStep === 'initialReveal' && isCurrentPlayer) {
            disabled = revealedCards() >= 2;
          }

          return (
            <GameCard
              key={card.id}
              card={card}
              disabled={disabled}
              onClick={handleClick}
            />)
        })}
      </div>
    </div>
  )
}

const GameCard = ({
  card,
  isDiscard = false,
  isDeck = false,
  onClick = () => { },
  disabled = false
}: {
  card: Card;
  isDiscard?: boolean;
  isDeck?: boolean;
  onClick?: (cardId: string) => void;
  disabled?: boolean;
}) => {

  const { game } = useGame();
  const { userId } = useUser();

  if (!game || !userId) return null;
  if (!game.gameData) return null;

  return (
    <div className={`${(isDeck || isDiscard) ? 'flex flex-col justify-center items-center gap-2' : ''}`}>
      <button
        className={`play-card 
        ${card.color === 'red' && card.revealed ? 'bg-card-red' : ' '}
        ${card.color === 'green' && card.revealed ? 'bg-card-green' : ' '}
        ${card.color === 'yellow' && card.revealed ? 'bg-card-yellow' : ' '}
        ${card.color === 'zero' && card.revealed ? 'bg-card-zero' : ' '}
        ${card.color === 'negative' && card.revealed ? 'bg-card-negative' : ' '}
        ${!disabled ? 'animate-small-scale' : ' '}
        `}
        disabled={disabled}
        onClick={() => onClick(card.id)}
      >
        {card.revealed ? card.value : '?'}
      </button>
      {isDiscard && <span>défausse</span>}
      {isDeck && <span>pioche</span>}
    </div>
  )
}

export default Game