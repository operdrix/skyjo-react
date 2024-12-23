import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";

const Instructions = () => {

  const { game } = useGame();
  const { userId } = useUser();

  // Message pour le joueur actuel
  const playerMessage = () => {
    if (!game || !userId) return '';
    if (game.gameData.currentStep === 'initialReveal') {
      return 'Révélez deux cartes';
    }
    if (game.gameData.currentPlayer === userId) {
      if (game.gameData.currentStep === 'draw') {
        return (<>Piochez une carte <br />(Pioche ou défausse)</>);
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
    if (game.gameData.currentStep === 'endGame') {
      return 'Fin de la manche';
    }
    return 'Au tour de ' + game.players.find(player => player.id === game.gameData.currentPlayer)?.username;
  }

  return (
    <p className="text-lg md:text-xl lg:text-2xl text-center py-4 h-20">{playerMessage()}</p>
  )
}

export default Instructions