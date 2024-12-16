import GameCard from "@/components/game/GameCard";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";

const Deck = () => {

  const { userId } = useUser();
  const { sendMessage } = useWebSocket()
  const { game } = useGame();

  // Détermination si la pioche est sélectionnable
  const isDeckSelectable = () => {
    if (!game || !userId) return false;
    if (game.gameData.currentStep === 'initialReveal') return false;
    if (game.gameData.currentPlayer !== userId) return false;
    if (game.gameData.currentStep === 'draw') return true;
    if (game.gameData.currentStep === 'replace-discard') return false;
    return false;
  }

  // Click sur la pioche
  const handleClickOnDeck = () => {
    if (!game || !userId) return;
    if (!isDeckSelectable()) return;
    game.gameData.deckCards[0].revealed = true;
    game.gameData.deckCards[0].onHand = true;
    game.gameData.currentStep = 'decide-deck';
    sendMessage("play-move", { room: game.id, gameData: game.gameData });
  }

  if (!game || !userId) return null;

  return (
    <GameCard
      disabled={!isDeckSelectable()}
      isDeck
      card={game.gameData.deckCards[0]}
      onClick={handleClickOnDeck}
    />
  )
}

export default Deck