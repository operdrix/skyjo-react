import type { playerStats } from "@/game/stats";

// Bandeau des statistiques du joueur
export default function StatsBar({
  stats,
  userName,
}: {
  stats: ReturnType<typeof playerStats>;
  userName: string | null;
}) {
  const { finishedGames, createdGames, totalRounds, maxRounds, victories, defeats, victoryRate } = stats;

  return (
    <div className="stats stats-vertical md:stats-horizontal shadow-sm">
      <div className="stat">
        <div className="stat-figure text-card-negative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="size-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div className="stat-title">Parties terminées</div>
        <div className="stat-value text-card-negative">{finishedGames}</div>
        <div className="stat-desc">
          {/* Nombre de parties créées par le joueur */}
          {`${createdGames} parties créées`}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title">Manches</div>
        <div className="stat-value text-card-yellow">{totalRounds}</div>
        <div className="stat-desc">Record de {maxRounds} sur une partie</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-green-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block h-8 w-8 stroke-current"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div className="stat-title">Victoires</div>
        <div className="stat-value text-green-600">{victories}</div>
        <div className="stat-desc">Et {defeats} défaites</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-secondary">
          <div className="avatar avatar-online avatar-placeholder">
            <div className="bg-neutral text-neutral-content w-16 rounded-full">
              <span className="text-xl">{userName?.slice(0, 1)}</span>
            </div>
          </div>
        </div>
        <div
          className={`stat-value ${
            victoryRate > 50 ? "text-green-600" : victoryRate < 50 ? "text-red-600" : "text-blue-500"
          }`}
        >
          {victoryRate}%
        </div>
        <div className="stat-title">de victoires</div>
      </div>
    </div>
  );
}
