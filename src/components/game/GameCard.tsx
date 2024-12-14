import { useGame } from "../../hooks/Game";
import { useUser } from "../../hooks/User";
import { Card } from "../../types/types";

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
            ${haveCardUnderInDeckOrDiscard() ? 'absolute' : ''}
            ${card.color === 'red' && card.revealed ? '!bg-card-red' : ''}
            ${card.color === 'green' && card.revealed ? '!bg-card-green' : ''}
            ${card.color === 'yellow' && card.revealed ? '!bg-card-yellow' : ''}
            ${card.color === 'zero' && card.revealed ? '!bg-card-zero' : ''}
            ${card.color === 'negative' && card.revealed ? '!bg-card-negative' : ''}
            ${!disabled ? 'animate-small-scale' : ''}
            ${game.gameData.currentStep === 'decide-deck' && isDiscard ? 'play-card-discard' : ''}
            ${card.onHand ? 'rotate-12' : ''}
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

export default GameCard;