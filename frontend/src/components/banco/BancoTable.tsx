import GuestTag from "@/components/GuestTag";
import PlayingCard from "@/components/PlayingCard";
import GameMenu from "@/components/game/GameMenu";
import GameSettings from "@/components/game/GameSettings";
import RoundResults from "@/components/game/RoundResults";
import ModalScore from "@/components/game/messages/ModalScore";
import { STATUS_LABELS, handTotal } from "@/game/banco";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useGameAction } from "@/hooks/useGameAction";
import type { BancoGame } from "@/types/types";
import { useId, useState } from "react";

const STATUS_BADGES = { playing: "badge-success", stopped: "badge-info", busted: "badge-error" } as const;

// Un joueur à la table : ses cartes, ses points de la manche, son état et son total de partie
function BancoPlayer({ game, playerId, isMe }: { game: BancoGame; playerId: string; isMe: boolean }) {
  const titleId = useId();
  const player = game.players.find((p) => p.id === playerId);
  const { hands, status, currentPlayer } = game.gameData;
  const hand = hands[playerId] ?? [];
  const playerStatus = status[playerId];

  return (
    <section
      aria-labelledby={titleId}
      className={`panel flex flex-col gap-2 p-2 sm:p-3 ${currentPlayer === playerId ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={titleId} className="truncate font-bold">
          {player?.username}
          {isMe && <span className="ml-1 text-xs font-normal text-muted">(toi)</span>}
        </h3>
        <GuestTag player={player} />
        <span className={`badge badge-sm ${STATUS_BADGES[playerStatus]}`}>{STATUS_LABELS[playerStatus]}</span>
        <span className="ml-auto font-display font-bold tabular-nums">{handTotal(hand, playerStatus)} pts</span>
      </div>
      <div
        className={`flex flex-wrap gap-1 ${playerStatus === "busted" ? "opacity-50" : ""}`}
        style={{ "--card-w": isMe ? "var(--board-card-w)" : "var(--top-card-w)" } as React.CSSProperties}
      >
        {hand.map((card) => (
          <PlayingCard key={card.id} value={card.value} />
        ))}
      </div>
      <p className="text-xs text-muted tabular-nums">Total {player?.game_players.score ?? 0}</p>
    </section>
  );
}

// Ce qui vient de se passer, puis à qui c'est le tour
function turnMessage(game: BancoGame, userId: string) {
  const { lastDraw, currentPlayer, status, roundOver, hands } = game.gameData;
  const name = (id: string) => game.players.find((p) => p.id === id)?.username ?? "?";
  const parts: string[] = [];
  if (lastDraw) {
    const busted = status[lastDraw.playerId] === "busted";
    const seven = new Set((hands[lastDraw.playerId] ?? []).map((card) => card.value)).size >= 7;
    const outcome = busted ? " : éliminé !" : seven ? " : 7 nombres, +15 !" : "";
    parts.push(`${name(lastDraw.playerId)} a tiré un ${lastDraw.card.value}${outcome}`);
  }
  if (roundOver) parts.push("Fin de la manche");
  else if (currentPlayer === userId) parts.push("À toi : Encore ou Stop ?");
  else if (currentPlayer) parts.push(`${name(currentPlayer)} joue`);
  return parts.join(" · ");
}

// Table de Banco : adversaires en haut, consigne ou résultats au centre, le joueur et ses boutons en bas
const BancoTable = () => {
  const { game: anyGame } = useGame();
  const { userId } = useUser();
  const sendMessage = useGameAction();
  const [sending, setSending] = useState(false);

  if (!anyGame || !userId) return null;
  const game = anyGame as unknown as BancoGame;
  const { turnOrder, currentPlayer, status, roundOver, deckCount } = game.gameData;
  const myTurn = !roundOver && currentPlayer === userId && status[userId] === "playing";
  const others = turnOrder.filter((id) => id !== userId);

  const play = async (move: "hit" | "stay") => {
    setSending(true);
    await sendMessage("play-move", { room: game.id, move });
    setSending(false);
  };

  return (
    <>
      <ModalScore />
      <div className="flex h-dvh flex-col">
        <div className="flex items-center justify-between px-2 pt-2">
          <GameMenu />
          <GameSettings />
        </div>

        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-2 overflow-y-auto p-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {others.map((id) => (
              <BancoPlayer key={id} game={game} playerId={id} isMe={false} />
            ))}
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2">
            {roundOver ? (
              <RoundResults />
            ) : (
              <p className="text-sm text-muted tabular-nums">Pioche : {deckCount} cartes</p>
            )}
            <p role="status" className="game-hint text-center">
              {turnMessage(game, userId)}
            </p>
          </div>

          {turnOrder.includes(userId) && <BancoPlayer game={game} playerId={userId} isMe />}

          {!roundOver && (
            <div className="flex justify-center gap-3 pb-2">
              <button className="btn btn-primary btn-lg" onClick={() => play("hit")} disabled={!myTurn || sending}>
                Encore
              </button>
              <button className="btn btn-lg" onClick={() => play("stay")} disabled={!myTurn || sending}>
                Stop
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default BancoTable;
