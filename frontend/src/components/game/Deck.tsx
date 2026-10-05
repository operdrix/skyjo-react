import GameCard from "@/components/game/GameCard";
import { drawFromDeck } from "@/game/moves";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useGameAction } from "@/hooks/useGameAction";
import notify from "@/utils/notify";

const Deck = () => {
  const { userId } = useUser();
  const sendMessage = useGameAction();
  const { game, sound } = useGame();

  // Détermination si la pioche est sélectionnable
  const isDeckSelectable = () => {
    if (!game || !userId) return false;
    if (game.gameData.currentStep === "initialReveal") return false;
    if (game.gameData.currentPlayer !== userId) return false;
    if (game.gameData.currentStep === "draw") return true;
    if (game.gameData.currentStep === "replace-discard") return false;
    return false;
  };

  // Click sur la pioche
  const handleClickOnDeck = () => {
    if (!game || !userId) return;
    if (!isDeckSelectable()) return;
    notify("turnCard", !sound);
    sendMessage("play-move", { room: game.id, gameData: drawFromDeck(game.gameData) });
  };

  if (!game || !userId) return null;

  return (
    <GameCard disabled={!isDeckSelectable()} isDeck card={game.gameData.deckCards[0]} onClick={handleClickOnDeck} />
  );
};

export default Deck;
