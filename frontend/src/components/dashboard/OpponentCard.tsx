import type { OpponentStats } from "@/game/stats";

// Bilan contre un adversaire ; un clic filtre l'historique sur cet adversaire
export default function OpponentCard({ opponent, selected, onSelect }: {
  opponent: OpponentStats;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`shadow-md rounded-lg p-4 glass w-full text-black cursor-pointer ${selected ? 'bg-red-400' : 'bg-white'}`}
      onClick={onSelect}
    >
      <h3 className="text-lg font-bold">{opponent.username}</h3>
      <p>
        {`${opponent.games} parties: `}
        <span className="text-green-600">{opponent.defeats} victoires</span>
        {opponent.victories > 0 ? ` / ` : ''}
        {opponent.victories > 0 ? <span className="text-red-600">{opponent.victories} défaites</span> : ''}
      </p>
      <p className="text-xs">{opponent.rounds} manches jouées</p>
    </div>
  );
}
