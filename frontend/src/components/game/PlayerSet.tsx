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

  return (
    <>
      {/* <GameTurnNotifier isCurrentTurn={playerTurn && isCurrentPlayerSet} /> */}

      <div className={`flex flex-col justify-center items-center ${smallSet ? "small-set" : ""}`}>
        <h2
          className={`mb-2 flex min-h-8 items-center gap-2 rounded-full px-3 text-lg font-bold ${playerTurn ? "bg-success text-success-content" : ""}`}
        >
          {playerTurn && <span className="loading loading-dots loading-sm" aria-label="À son tour"></span>}
          {player?.username} <OnlineStatus status={player?.game_players?.status} />
        </h2>
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
        {/* <p className="h-6">
        {playerTurn && <span className="loading loading-dots loading-md mt-2"></span>}
      </p> */}
      </div>
    </>
  );
};

const OnlineStatus = ({ status }: { status: "connected" | "disconnected" | undefined }) => {
  if (!status) return null;
  const connected = status === "connected";
  return (
    <span
      role="img"
      aria-label={connected ? "connecté" : "déconnecté"}
      className={`inline-block size-2.5 rounded-full border-2 border-line ${connected ? "bg-success" : "bg-error"}`}
    />
  );
};

export default PlayerSet;
