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

  // Détermination si la pioche est sélectionnable
  const isDeckSelectable = () => {
    if (!game || !userId) return false;
    if (game.gameData.currentStep === 'initialReveal') return false;
    if (game.gameData.currentPlayer !== userId) return false;
    if (game.gameData.currentStep === 'draw') return true;
    if (game.gameData.currentStep === 'replace-discard') return false;
    return false;
  }

  // Détermination si la défausse est sélectionnable
  const isDiscardSelectable = () => {
    if (!game || !userId) return false;
    if (game.gameData.currentStep === 'initialReveal') return false;
    if (game.gameData.currentPlayer !== userId) return false;
    if (game.gameData.currentStep === 'draw') return true;
    if (game.gameData.currentStep === 'decide-deck') return true;

    return false;
  }

  // Message pour le joueur actuel
  const playerMessage = () => {
    if (!game || !userId) return '';
    if (game.gameData.currentStep === 'initialReveal') {
      return 'Révélez deux cartes';
    }
    if (game.gameData.currentPlayer === userId) {
      if (game.gameData.currentStep === 'draw') {
        return (<>Piochez une carte <br />(défausse ou pioche)</>);
      }
      if (game.gameData.currentStep === 'replace-discard') {
        return 'Echangez avec une carte de votre jeu';
      }
      if (game.gameData.currentStep === 'decide-deck') {
        return 'Défaussez ou remplacez une carte de votre jeu';
      }
      if (game.gameData.currentStep === 'flip-deck') {
        return 'Retournez une de vos cartes non visible';
      }
    }
    return 'Au tour de ' + game.players.find(player => player.id === game.gameData.currentPlayer)?.username;
  }

  // Click sur la pioche
  const handleClickOnDeck = () => {
    if (!isDeckSelectable()) return;
    game.gameData.deckCards[0].revealed = true;
    game.gameData.deckCards[0].onHand = true;
    game.gameData.currentStep = 'decide-deck';
    sendMessage("play-move", { room: game.id, gameData: game.gameData });
  }

  // Click sur la défausse
  const handleClickOnDiscard = () => {
    if (!isDiscardSelectable()) return;

    if (game.gameData.currentStep === 'decide-deck') {
      // on déplace la carte en main de la pioche vers la défausse
      game.gameData.deckCards[0].onHand = false;
      game.gameData.discardPile.push(game.gameData.deckCards[0]);
      game.gameData.deckCards.shift();
      game.gameData.currentStep = 'flip-deck';
      sendMessage("play-move", { room: game.id, gameData: game.gameData });
      return;
    }

    game.gameData.discardPile[game.gameData.discardPile.length - 1].onHand = true;
    game.gameData.currentStep = 'replace-discard';
    sendMessage("play-move", { room: game.id, gameData: game.gameData });
  }

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
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-xl text-center h-16">{playerMessage()}</p>
          <div className="flex justify-center items-center gap-9">
            {/* Défausse */}
            <GameCard
              disabled={!isDiscardSelectable()}
              isDiscard
              card={game.gameData.discardPile[game.gameData.discardPile.length - 1]}
              onClick={handleClickOnDiscard}
            />
            {/* Pioche */}
            <GameCard
              disabled={!isDeckSelectable()}
              isDeck
              card={game.gameData.deckCards[0]}
              onClick={handleClickOnDeck}
            />
          </div>
        </div>

        {/* Joueur à droite */}
        {game.players.length === 4 ? <PlayerSet playerId={playerIdRight} /> : <div></div>}

        {/* Ligne 3 : jour actuel */}

        <div></div>
        <PlayerSet playerId={userId} isCurrentPlayerSet />
        <div></div>

      </section>
    </>
  )
}

const PlayerSet = ({ playerId, isCurrentPlayerSet = false }: {
  playerId: string;
  isCurrentPlayerSet?: boolean;
}) => {

  const { game } = useGame();
  const { userId } = useUser();
  const { sendMessage } = useWebSocket();

  if (!game || !userId) return null;
  if (!game.gameData) return null;

  const playerCards = game.gameData.playersCards[playerId];
  const player = game.players.find(player => player.id === playerId);
  const playerTurn = (game.gameData.currentPlayer === playerId) || game.gameData.currentStep === 'initialReveal';

  const revealedCards = () => {
    if (!game || !userId) return 0;
    const playerCards = game.gameData.playersCards[userId];
    return playerCards.filter(card => card.revealed).length;
  };

  const handleClickOnCard = (cardId: string) => {

    if (!isCurrentPlayerSet) return; // si ce ne sont pas les cartes du joueur actuel, on ne fait rien
    const cardIndex = playerCards.findIndex((c) => c.id === cardId);

    if (game.gameData.currentStep === 'initialReveal') {
      // Révéler la carte cliquée par le joueur actuel dans la limite de deux cartes
      if (revealedCards() <= 1) {
        game.gameData.playersCards[userId][cardIndex].revealed = true;
      }

      console.log('Cartes révélées:', game.gameData.playersCards[userId]);

      // Envoyer un message pour révéler la carte
      sendMessage("play-move", { room: game.id, gameData: game.gameData });
    }

    if (game.gameData.currentStep === 'replace-discard') {
      // On récupère la carte de la défausse (la dernière carte qui est normalement onHand = true)
      // On la remplace par la carte cliquée par le joueur actuel
      // On la remet dans le jeu du joueur actuel au même endroit que la carte cliquée
      const discardCard = game.gameData.discardPile[game.gameData.discardPile.length - 1];
      const playerCard = playerCards[cardIndex];
      discardCard.onHand = false;
      playerCard.onHand = false;
      playerCard.revealed = true;
      game.gameData.playersCards[userId][cardIndex] = discardCard;
      game.gameData.discardPile[game.gameData.discardPile.length - 1] = playerCard;

      game.gameData.currentStep = 'endTurn';
      // Envoyer un message pour remplacer la carte
      sendMessage("play-move", { room: game.id, gameData: game.gameData });
    }

    if (game.gameData.currentStep === 'decide-deck') {
      // Etapes :
      // 1. On défausse la carte cliquée
      // 2. On remplace la carte cliquée par la carte du dessus de la pioche
      // 3. On retire la carte du dessus de la pioche
      // 4. On passe à l'étape suivante endTurn

      game.gameData.deckCards[0].onHand = false;
      game.gameData.discardPile.push(game.gameData.playersCards[userId][cardIndex]);
      game.gameData.playersCards[userId][cardIndex] = game.gameData.deckCards[0];
      game.gameData.deckCards.shift();
      game.gameData.currentStep = 'endTurn';
      sendMessage("play-move", { room: game.id, gameData: game.gameData });
    }

    if (game.gameData.currentStep === 'flip-deck') {
      // Retourner la carte cliquée par le joueur actuel
      game.gameData.playersCards[userId][cardIndex].revealed = true;
      game.gameData.currentStep = 'endTurn';
      sendMessage("play-move", { room: game.id, gameData: game.gameData });
    }
  }

  return (
    <div className="flex flex-col justify-center items-center h-full min-h-48">
      <h2 className="flex items-center gap-3 text-xl font-bold mb-2">
        {player?.username}
        {playerTurn && <span className="loading loading-dots loading-md"></span>}
      </h2>
      <div className={`grid gap-2 ${playerCards.length === 12 ? 'grid-cols-4' : playerCards.length === 9 ? 'grid-cols-3' : playerCards.length === 6 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {playerCards.map((card) => {

          let disabled = false;
          if (!isCurrentPlayerSet || !playerTurn) {
            disabled = true;
          } else if (game.gameData.currentStep === 'initialReveal') {
            disabled = revealedCards() >= 2;
          } else if (game.gameData.currentStep === 'draw') {
            disabled = true;
          } else if (game.gameData.currentStep === 'replace-discard') {
            disabled = false;
          } else if (game.gameData.currentStep === 'flip-deck') {
            disabled = card.revealed;
          }

          return (
            <GameCard
              key={card.id}
              card={card}
              disabled={disabled}
              onClick={handleClickOnCard}
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

  const haveCardUnderInDeckOrDiscard = () => {
    if (isDeck) {
      return game.gameData.deckCards.length > 1;
    }
    if (isDiscard) {
      return game.gameData.discardPile.length > 1;
    }
    return false;
  }

  const defaultValue = () => {
    if (game.gameData.currentStep === 'decide-deck' && isDiscard) {
      return (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </>
      )
    }
    if (card.revealed) return card.value;
    return '?';
  }

  return (
    <div className={`${(isDeck || isDiscard) ? 'flex flex-col justify-center items-center gap-2' : ''}`}>
      <div className={`${(haveCardUnderInDeckOrDiscard()) ? 'relative play-card border-none' : ''}`}>

        {(haveCardUnderInDeckOrDiscard()) &&
          <button
            className={`play-card absolute`}
            disabled={true}
            onClick={() => onClick(card.id)}
          >
            {'?'}
          </button>
        }
        <button
          className={`play-card 
        ${haveCardUnderInDeckOrDiscard() ? 'absolute' : ' '}
        ${card.color === 'red' && card.revealed ? 'bg-card-red' : ' '}
        ${card.color === 'green' && card.revealed ? 'bg-card-green' : ' '}
        ${card.color === 'yellow' && card.revealed ? 'bg-card-yellow' : ' '}
        ${card.color === 'zero' && card.revealed ? 'bg-card-zero' : ' '}
        ${card.color === 'negative' && card.revealed ? 'bg-card-negative' : ' '}
        ${!disabled ? 'animate-small-scale' : ' '}
        ${game.gameData.currentStep === 'decide-deck' && isDiscard ? 'play-card-discard' : ' '}
        ${card.onHand ? 'rotate-12' : ' '}
        `}
          disabled={disabled}
          onClick={() => onClick(card.id)}
        >

          {defaultValue()}

        </button>
      </div>
      {isDiscard && <span>défausse</span>}
      {isDeck && <span>pioche</span>}
    </div>
  )
}

export default Game