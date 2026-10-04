import PlayingCard from "@/components/PlayingCard";

// Éventail de cartes décoratif (accueil, pages d'authentification)
const FAN = [
  { value: undefined, transform: "translateX(-150%) rotate(-16deg) translateY(26px)" },
  { value: -2, transform: "translateX(-90%) rotate(-6deg)" },
  { value: 0, transform: "translateX(-25%) rotate(5deg) translateY(4px)" },
  { value: 12, transform: "translateX(42%) rotate(15deg) translateY(24px)" },
];

const CardFan = ({ className = "" }: { className?: string }) => (
  <div aria-hidden="true" className={`relative h-56 [--card-w:104px] ${className}`}>
    {FAN.map(({ value, transform }, index) => (
      <PlayingCard key={index} value={value} className="absolute left-1/2 top-4" style={{ transform }} />
    ))}
  </div>
);

export default CardFan;
