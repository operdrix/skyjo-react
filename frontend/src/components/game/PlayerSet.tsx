import GameCard from "@/components/game/GameCard";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import notify from "@/utils/notify";
import { useState } from "react";

const PlayerSet = ({ playerId, isCurrentPlayerSet = false, smallSet = false }: {
  playerId: string;
  isCurrentPlayerSet?: boolean;
  smallSet?: boolean;
}) => {

  const { game, sound } = useGame();
  const { userId } = useUser();
  const { sendMessage } = useWebSocket();
  const [loading, setLoading] = useState(false);

  if (!game || !userId) return null;
  if (!game.gameData) return null;

  const playerCards = game.gameData?.playersCards?.[playerId] || [];
  const player = game.players.find(player => player.id === playerId);
  const revealedCards = () => {
    if (!game || !userId) return 0;
    const playerCards = game.gameData.playersCards[playerId];
    return playerCards.filter(card => card.revealed).length;
  };
  const playerTurn = (
    game.gameData.currentPlayer === playerId && game.gameData.currentStep !== 'endGame'
  ) || (
      game.gameData.currentStep === 'initialReveal' && revealedCards() < 2
    );

  const handleClickOnCard = async (cardId: string) => {

    if (!isCurrentPlayerSet) return; // si ce ne sont pas les cartes du joueur actuel, on ne fait rien
    const cardIndex = playerCards.findIndex((c) => c.id === cardId);

    if (game.gameData.currentStep === 'initialReveal') {
      setLoading(true);
      // Révéler la carte cliquée par le joueur actuel dans la limite de deux cartes
      if (revealedCards() <= 1) {
        notify('turnCard', !sound);
        game.gameData.playersCards[userId][cardIndex].revealed = true;
      }

      console.log('Cartes révélées:', game.gameData.playersCards[userId]);

      // Envoyer un message pour révéler la carte
      sendMessage("initial-turn-card", { room: game.id, playerId, cardId });
      //sendMessage("play-move", { room: game.id, gameData: game.gameData });
      // petite tempo pour pas cliquer trop vite et bloquer le jeu
      setTimeout(() => {
        setLoading(false);
      }, 300);

    }

    if (game.gameData.currentStep === 'replace-discard') {
      // On récupère la carte de la défausse (la dernière carte qui est normalement onHand = true)
      // On la remplace par la carte cliquée par le joueur actuel
      // On la remet dans le jeu du joueur actuel au même endroit que la carte cliquée
      notify('turnCard', !sound);
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
      notify('turnCard', !sound);
      game.gameData.deckCards[0].onHand = false;
      game.gameData.playersCards[userId][cardIndex].revealed = true;
      game.gameData.discardPile.push(game.gameData.playersCards[userId][cardIndex]);
      game.gameData.playersCards[userId][cardIndex] = game.gameData.deckCards[0];
      game.gameData.deckCards.shift();
      game.gameData.currentStep = 'endTurn';
      sendMessage("play-move", { room: game.id, gameData: game.gameData });
    }

    if (game.gameData.currentStep === 'flip-deck') {
      // Retourner la carte cliquée par le joueur actuel
      notify('turnCard', !sound);
      game.gameData.playersCards[userId][cardIndex].revealed = true;
      game.gameData.currentStep = 'endTurn';
      sendMessage("play-move", { room: game.id, gameData: game.gameData });
    }
  }

  const getGridColsClass = (length: number) => {
    if (length === 12) return 'grid-cols-4';
    if (length === 9) return 'grid-cols-3';
    if (length === 6) return 'grid-cols-2';
    return 'grid-cols-1';
  };

  return (
    <>
      {/* <GameTurnNotifier isCurrentTurn={playerTurn && isCurrentPlayerSet} /> */}

      <div className={`flex flex-col justify-center items-center ${smallSet ? 'small-set' : ''}`}>
        <h2 className="indicator items-center gap-3 text-xl font-bold mb-2 min-h-8">
          {playerTurn && <span className="loading loading-dots loading-md"></span>}
          {player?.username} <OnlineStatus status={player?.game_players?.status} />
        </h2>
        <div className={`grid gap-1 md:gap-2 ${getGridColsClass(playerCards?.length || 0)}`}>
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
                disabled={disabled || loading}
                onClick={handleClickOnCard}
              />)
          })}
        </div>
        {/* <p className="h-6">
        {playerTurn && <span className="loading loading-dots loading-md mt-2"></span>}
      </p> */}
      </div>
    </>
  )
}

const OnlineStatus = ({ status }: { status: 'connected' | 'disconnected' | undefined }) => {
  if (!status) return null;
  return (
    // <span className={`indicator-item loading loading-ring loading-xs ${status === 'connected' ? 'text-success' : 'text-error'}`}></span>
    // <span className={`indicator-item text-xl ${status === 'connected' ? 'text-success' : 'text-error'}`}>•</span>
    <sup className={`text-base font-mono -left-2 ${status === 'connected' ? 'text-success' : 'text-error'}`}>&bull;</sup>
  )
}

export default PlayerSet;