import GameCard from "@/components/game/GameCard";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";

const Discard = () => {

  const { userId } = useUser();
  const { sendMessage } = useWebSocket()
  const { game } = useGame();

  // Détermination si la défausse est sélectionnable
  const isDiscardSelectable = () => {
    if (!game || !userId) return false;
    if (game.gameData.currentStep === 'initialReveal') return false;
    if (game.gameData.currentPlayer !== userId) return false;
    if (game.gameData.currentStep === 'draw') return true;
    if (game.gameData.currentStep === 'decide-deck') return true;

    return false;
  }

  const handleClickOnDiscard = () => {
    if (!game || !userId) return;
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

  if (!game || !userId) return null;

  return (
    <GameCard
      disabled={!isDiscardSelectable()}
      isDiscard
      card={game.gameData.discardPile[game.gameData.discardPile.length - 1]}
      onClick={handleClickOnDiscard}
    />
  );
};

export default Discard;