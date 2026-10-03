import GameCard from "@/components/game/GameCard";
import { flipCard, replaceWithDiscard, replaceWithDrawn, revealInitialCard } from "@/game/moves";
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

  const { game, setGame, sound } = useGame();
  const { userId } = useUser();
  const { sendMessage } = useWebSocket();
  const [loading, setLoading] = useState(false);

  if (!game || !userId) return null;
  if (!game.gameData) return null;

  const playerCards = game.gameData?.playersCards?.[playerId] || [];
  const player = game.players.find(player => player.id === playerId);
  const revealedCards = () => playerCards.filter(card => card.revealed).length;
  const playerTurn = (
    game.gameData.currentPlayer === playerId && game.gameData.currentStep !== 'endGame'
  ) || (
      game.gameData.currentStep === 'initialReveal' && revealedCards() < 2
    );

  const handleClickOnCard = async (cardId: string) => {

    if (!isCurrentPlayerSet) return; // si ce ne sont pas les cartes du joueur actuel, on ne fait rien
    const cardIndex = playerCards.findIndex((c) => c.id === cardId);
    const step = game.gameData.currentStep;

    if (step === 'initialReveal') {
      setLoading(true);
      if (revealedCards() <= 1) {
        notify('turnCard', !sound);
        // Affichage immédiat, le serveur renvoie ensuite la partie à jour
        setGame({ ...game, gameData: revealInitialCard(game.gameData, userId, cardIndex) });
      }
      sendMessage("initial-turn-card", { room: game.id, playerId, cardId });
      // petite tempo pour pas cliquer trop vite et bloquer le jeu
      setTimeout(() => {
        setLoading(false);
      }, 300);
      return;
    }

    // Échange avec la défausse, échange avec la carte piochée, ou carte retournée
    const move = { 'replace-discard': replaceWithDiscard, 'decide-deck': replaceWithDrawn, 'flip-deck': flipCard }[step as string];
    if (move) {
      notify('turnCard', !sound);
      sendMessage("play-move", { room: game.id, gameData: move(game.gameData, userId, cardIndex) });
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