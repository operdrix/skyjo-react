import { formatPoints, formatScore } from "@/game/scores";
import GameCard from "@/components/game/GameCard";
import { flipCard, replaceWithDiscard, replaceWithDrawn, revealInitialCard } from "@/game/moves";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import notify from "@/utils/notify";
import { useState } from "react";

const PlayerSet = ({
  playerId,
  isCurrentPlayerSet = false,
  smallSet = false,
}: {
  playerId: string;
  isCurrentPlayerSet?: boolean;
  smallSet?: boolean;
}) => {
  const { game, setGame, sound } = useGame();
  const { userId } = useUser();
  const { sendMessage } = useWebSocket();
  const [loading, setLoading] = useState(false);

  if (!game || !userId) return null;
  if (!game.gameData) return null;

  const playerCards = game.gameData?.playersCards?.[playerId] || [];
  const player = game.players.find((player) => player.id === playerId);
  // En fin de manche : points marqués par ce joueur, affichés à côté de son nom
  const rounds = player?.game_players?.scoreByRound ?? [];
  const roundScore = game.gameData.currentStep === "endGame" && rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const revealedCards = () => playerCards.filter((card) => card.revealed).length;
  const playerTurn =
    (game.gameData.currentPlayer === playerId && game.gameData.currentStep !== "endGame") ||
    (game.gameData.currentStep === "initialReveal" && revealedCards() < 2);

  const handleClickOnCard = async (cardId: string) => {
    if (!isCurrentPlayerSet) return; // si ce ne sont pas les cartes du joueur actuel, on ne fait rien
    const cardIndex = playerCards.findIndex((c) => c.id === cardId);
    const step = game.gameData.currentStep;

    if (step === "initialReveal") {
      setLoading(true);
      if (revealedCards() <= 1) {
        notify("turnCard", !sound);
        // Affichage immédiat, le serveur renvoie ensuite la partie à jour
        setGame({ ...game, gameData: revealInitialCard(game.gameData, userId, cardIndex) });
      }
      sendMessage("initial-turn-card", { room: game.id, playerId, cardId });
      // petite tempo pour pas cliquer trop vite et bloquer le jeu
      setTimeout(() => {
        setLoading(false);
      }, 300);
      return;
    }

    // Échange avec la défausse, échange avec la carte piochée, ou carte retournée
    const move = { "replace-discard": replaceWithDiscard, "decide-deck": replaceWithDrawn, "flip-deck": flipCard }[
      step as string
    ];
    if (move) {
      notify("turnCard", !sound);
      sendMessage("play-move", { room: game.id, gameData: move(game.gameData, userId, cardIndex) });
    }
  };

  const getGridColsClass = (length: number) => {
    if (length === 12) return "grid-cols-4";
    if (length === 9) return "grid-cols-3";
    if (length === 6) return "grid-cols-2";
    return "grid-cols-1";
  };

  const total = player?.game_players?.score ?? 0;
  const roundBadge = roundScore !== null && (
    <span
      aria-label={`${formatPoints(roundScore)} points cette manche`}
      className="badge badge-sm badge-accent font-display tabular-nums"
    >
      {formatPoints(roundScore)}
    </span>
  );
  const cards = (
    <div className={`grid gap-[calc(var(--card-w)*0.1)] ${getGridColsClass(playerCards?.length || 0)}`}>
      {playerCards.map((card) => {
        let disabled = false;
        if (!isCurrentPlayerSet || !playerTurn) {
          disabled = true;
        } else if (game.gameData.currentStep === "initialReveal") {
          disabled = revealedCards() >= 2;
        } else if (game.gameData.currentStep === "draw") {
          disabled = true;
        } else if (game.gameData.currentStep === "replace-discard") {
          disabled = false;
        } else if (game.gameData.currentStep === "flip-deck") {
          disabled = card.revealed;
        }

        return <GameCard key={card.id} card={card} disabled={disabled || loading} onClick={handleClickOnCard} />;
      })}
    </div>
  );

  // Ton jeu : « Toi » à gauche, manche et total à droite, au-dessus des cartes
  if (isCurrentPlayerSet) {
    return (
      <section aria-labelledby={`joueur-${playerId}`} className="flex w-max max-w-full flex-col">
        <div className="mb-1 flex items-center justify-between gap-2 md:mb-2">
          <h2
            id={`joueur-${playerId}`}
            className={`flex min-h-7 items-center gap-1.5 rounded-full px-2 font-bold ${playerTurn ? "player-turn bg-success text-success-content" : ""}`}
          >
            {playerTurn && <span className="loading loading-dots loading-xs" aria-label="À ton tour"></span>}
            Toi
            <OnlineStatus status={player?.game_players?.status} />
            {roundBadge}
          </h2>
          <p className="text-sm font-semibold whitespace-nowrap tabular-nums">
            Manche {game.roundNumber} · {formatScore(total)} pts
          </p>
        </div>
        {cards}
      </section>
    );
  }

  // Adversaire : un cadre avec son nom et son total, mis en évidence quand c'est son tour
  return (
    <div
      role="group"
      aria-label={player?.username}
      className={`opponent-panel ${smallSet ? "small-set" : ""} ${playerTurn ? "player-turn" : ""}`}
    >
      <p className="mb-1 flex items-center justify-between gap-1 text-xs font-bold sm:text-sm">
        <span className="flex min-w-0 items-center gap-1">
          {playerTurn && <span className="loading loading-dots loading-xs shrink-0" aria-label="À son tour"></span>}
          <span className="truncate">{player?.username}</span>
          <OnlineStatus status={player?.game_players?.status} />
        </span>
        {/* En fin de manche, les points de la manche remplacent le total (affiché dans les résultats) */}
        <span className="shrink-0 tabular-nums">{roundBadge || formatScore(total)}</span>
      </p>
      {cards}
    </div>
  );
};

const OnlineStatus = ({ status }: { status: "connected" | "disconnected" | undefined }) => {
  if (!status) return null;
  const connected = status === "connected";
  return (
    <span
      role="img"
      aria-label={connected ? "connecté" : "déconnecté"}
      className={`inline-block size-2.5 shrink-0 rounded-full border-2 border-line ${connected ? "bg-success" : "bg-error"}`}
    />
  );
};

export default PlayerSet;
