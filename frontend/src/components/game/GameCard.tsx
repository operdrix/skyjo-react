import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { Card } from "@/types/types";
import { useEffect, useRef, useState } from "react";

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

  const handleOnClick = () => {
    onClick(card.id);
  };
  const showBehind = haveCardUnderInDeckOrDiscard();
  const showBin = (game.gameData.currentStep === 'decide-deck' && isDiscard);

  if (isDeck) {
    return <DeckCard card={card} onClick={handleOnClick} disabled={disabled} showBehind={showBehind} />
  } else if (isDiscard) {
    return <DiscardCard card={card} onClick={handleOnClick} disabled={disabled} showBehind={showBehind} showBin={showBin} />
  } else {
    return <NormalCard card={card} onClick={handleOnClick} disabled={disabled} />
  }

}

function FlipCard({ card, onClick, disabled }: { card: Card; onClick?: () => void; disabled?: boolean }) {

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevRevealedRef = useRef(card.revealed);

  useEffect(() => {
    // Si la carte passe de non révélée (false) à révélée (true)
    if (!prevRevealedRef.current && card.revealed) {
      setShouldAnimate(true); // On active l'animation
    }
    // Mettre à jour la valeur précédente
    prevRevealedRef.current = card.revealed;
  }, [card.revealed]);

  function getCardColorClass(color: string, revealed: boolean) {
    if (!revealed) return 'bg-base-200 text-base-content';
    switch (color) {
      case 'red': return 'bg-card-red text-black';
      case 'green': return 'bg-card-green text-black';
      case 'yellow': return 'bg-card-yellow text-black';
      case 'zero': return 'bg-card-zero text-black';
      case 'negative': return 'bg-card-negative text-black';
      default: return 'bg-base-200  text-base-content';
    }
  }

  const cardColorClass = getCardColorClass(card.color, card.revealed);
  const isFlipped = card.revealed;

  return (
    <div className={`relative select-none ${disabled ? '' : 'cursor-pointer'} ${!disabled ? 'animate-small-scale' : ''} ${card.onHand ? 'rotate-12' : ''}`} onClick={disabled ? undefined : onClick}>
      <div className="perspective">
        <div className={`play-card transform transform-style-preserve-3d ${shouldAnimate ? 'transition-transform duration-500' : ''} ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Face avant (cachée) */}
          <div className={`absolute w-full h-full flex justify-center items-center rounded border-2 border-black backface-hidden ${cardColorClass}`}>
            ?
          </div>
          {/* Face arrière (révélée) */}
          <div className={`absolute w-full h-full flex justify-center items-center rounded border-2 border-black backface-hidden rotate-y-180 ${cardColorClass}`}>
            {card.revealed ? card.value : '?'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Carte derrière (ex: pour la pioche ou la défausse)
function ExtraCardBehind() {
  return (
    <div className="play-card border-2 border-black absolute text-black bg-white top-0">
      ?
    </div>
  );
}

// Icône de la corbeille (pour la défausse en mode decide-deck)
function DiscardBin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 animate-small-scale">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

// Carte normale
function NormalCard({ card, onClick, disabled }: { card: Card; onClick?: () => void; disabled?: boolean }) {
  return <FlipCard card={card} onClick={onClick} disabled={disabled} />;
}

// Carte de la pioche
function DeckCard({ card, onClick, disabled, showBehind }: { card: Card; onClick?: () => void; disabled?: boolean; showBehind: boolean }) {
  return (
    <div className="relative flex flex-col justify-center items-center gap-2">
      {showBehind && <ExtraCardBehind />}
      <div className="z-20">
        <FlipCard card={card} onClick={onClick} disabled={disabled} />
      </div>
      <span>pioche</span>
    </div>
  );
}

// Carte de la défausse
function DiscardCard({ card, onClick, disabled, showBehind, showBin }: { card: Card; onClick?: () => void; disabled?: boolean; showBehind: boolean; showBin: boolean }) {
  return (
    <div className="relative flex flex-col justify-center items-center gap-2">
      {showBehind && <ExtraCardBehind />}
      {showBin ? (
        <button className="play-card play-card-discard z-0" disabled={disabled} onClick={onClick}>
          <DiscardBin />
        </button>
      ) : (
        <FlipCard card={card} onClick={onClick} disabled={disabled} />
      )}
      <span>défausse</span>
    </div>
  );
}

export default GameCard;