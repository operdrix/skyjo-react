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
  const tiles = [
    { value: finishedGames, label: "Parties terminées", detail: `${createdGames} parties créées` },
    { value: victories, label: "Victoires", detail: `Et ${defeats} défaites` },
    { value: `${victoryRate}%`, label: "de victoires", detail: "sur les parties terminées" },
    { value: totalRounds, label: "Manches", detail: `Record de ${maxRounds} sur une partie` },
  ];

  return (
    <section className="w-full">
      <h1 className="mb-5 text-3xl font-bold sm:text-4xl">Salut {userName} 👋</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ value, label, detail }) => (
          <div key={label} className="panel p-4">
            <p className="font-display text-3xl font-bold tabular-nums sm:text-4xl">{value}</p>
            <p className="font-semibold">{label}</p>
            <p className="text-sm text-muted">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
