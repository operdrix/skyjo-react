import type { OpponentStats } from "@/game/stats";

// Bilan contre un adversaire ; un clic filtre l'historique sur cet adversaire
export default function OpponentCard({
  opponent,
  selected,
  onSelect,
}: {
  opponent: OpponentStats;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`panel w-full p-4 text-left transition-colors ${selected ? "bg-primary! text-primary-content" : ""}`}
    >
      <h3 className="text-lg font-bold">{opponent.username}</h3>
      <p className="tabular-nums">
        {`${opponent.games} parties : `}
        <span className="font-bold">{opponent.defeats} victoires</span>
        {opponent.victories > 0 ? ` / ${opponent.victories} défaites` : ""}
      </p>
      <p className={`text-xs ${selected ? "" : "text-muted"}`}>{opponent.rounds} manches jouées</p>
    </button>
  );
}
