import { formatPoints, formatScore, rankPlayers } from "@/game/scores";

type Player = { id: string; username: string; game_players: { score: number; scoreByRound: number[] } };

// Tableau des scores : « full » détaille chaque manche, « round » résume la dernière manche
export default function ScoreTable({
  players,
  userId,
  variant = "full",
  playAgain,
}: {
  players: Player[];
  userId: string | null;
  variant?: "full" | "round";
  playAgain?: string[];
}) {
  const ranking = rankPlayers(players);
  const roundCount = Math.max(0, ...ranking.map((p) => p.rounds.length));

  return (
    <table className="w-full text-sm tabular-nums">
      <thead>
        <tr className="text-left text-xs tracking-wide text-muted uppercase">
          <th className="w-8 py-1 pr-1">#</th>
          <th className="py-1">Joueur</th>
          {variant === "full" ? (
            Array.from({ length: roundCount }, (_, i) => (
              <th key={i} className="px-1 py-1 text-right">
                M{i + 1}
              </th>
            ))
          ) : (
            <th className="px-1 py-1 text-right">Manche</th>
          )}
          <th className="py-1 pl-2 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {ranking.map((player) => {
          const isMe = player.id === userId;
          return (
            <tr
              key={player.id}
              aria-current={isMe ? "true" : undefined}
              className={`border-t ${isMe ? "bg-base-200 font-bold" : ""}`}
            >
              <td className="py-1 sm:py-1.5 pr-1 font-display font-bold">{player.rank}</td>
              <td className="max-w-0 truncate py-1 sm:py-1.5">
                {playAgain && (
                  <span
                    role="img"
                    aria-label={playAgain.includes(player.id) ? "veut rejouer" : "en attente"}
                    className="mr-1"
                  >
                    {playAgain.includes(player.id) ? "✅" : "⏳"}
                  </span>
                )}
                {player.username}
                {isMe && <span className="ml-1 text-xs font-normal text-muted">(toi)</span>}
              </td>
              {variant === "full" ? (
                Array.from({ length: roundCount }, (_, i) => (
                  <td key={i} className="px-1 py-1 sm:py-1.5 text-right">
                    {player.rounds[i] === undefined ? "–" : formatScore(player.rounds[i])}
                  </td>
                ))
              ) : (
                <td className="px-1 py-1 sm:py-1.5 text-right">
                  {player.lastRound === null ? "–" : formatPoints(player.lastRound)}
                </td>
              )}
              <td className="py-1 sm:py-1.5 pl-2 text-right font-display text-base font-bold">
                {formatScore(player.total)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
