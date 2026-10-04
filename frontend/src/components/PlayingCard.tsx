import { cardTier } from "@/game/cards";

// Carte décorative aux couleurs du thème (face visible si une valeur est donnée, dos sinon).
// Le style vient de .playing-card dans index.css ; la largeur se règle avec la variable --card-w.
type Props = { value?: number; className?: string; style?: React.CSSProperties };

const PlayingCard = ({ value, className = "", style }: Props) => {
  if (value === undefined) {
    return (
      <div role="img" aria-label="carte cachée" className={`playing-card playing-card-back ${className}`} style={style}>
        <span className="playing-card-mono" aria-hidden="true">
          S
        </span>
      </div>
    );
  }

  const { tier, symbol } = cardTier(value);
  return (
    <div
      role="img"
      aria-label={`carte ${value}`}
      data-tier={tier}
      className={`playing-card ${className}`}
      style={style}
    >
      <span className="playing-card-symbol" aria-hidden="true">
        {symbol}
      </span>
      <span className="playing-card-value" aria-hidden="true">
        {value < 0 ? `−${-value}` : value}
      </span>
    </div>
  );
};

export default PlayingCard;
