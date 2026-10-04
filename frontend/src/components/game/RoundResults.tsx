import ScoreTable from "@/components/game/ScoreTable";
import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import { GameType } from "@/types/types";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router";

// Fin de manche ou de partie : les résultats prennent la place de la pioche, au centre de la table,
// pour que toutes les cartes restent visibles autour (rien n'est recouvert, même sur mobile)
const RoundResults = () => {
  const { game, setGame } = useGame();
  const { sendMessage, subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const { userId } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const titleId = useId();

  useEffect(() => {
    const handlePlayAgain = (newGame: GameType) => {
      setGame(newGame);
    };
    subscribeToEvent("play-again", handlePlayAgain);
    return () => {
      unsubscribeFromEvent("play-again", handlePlayAgain);
    };
  }, [setGame, subscribeToEvent, unsubscribeFromEvent]);

  if (!game || !userId) return null;

  const isCreator = game.creator === userId;
  const finished = game.state === "finished";
  const playersPlayAgain = game.playersPlayAgain || [];
  const wantsToPlayAgain = playersPlayAgain.includes(userId);

  const handleNextRound = () => {
    setLoading(true);
    sendMessage(finished ? "restart-game" : "start-game", { room: game.id });
  };

  // Le serveur ajoute l'émetteur à la liste des joueurs qui veulent rejouer
  const handleRequestNewGame = () => sendMessage("player-play-again", { room: game.id });

  return (
    <section aria-labelledby={titleId} className="panel w-full max-w-md p-3 sm:p-4 md:w-[26rem]">
      <h2 id={titleId} className="text-center text-lg font-bold sm:text-xl">
        {finished ? `🎉 Fin de la partie en ${game.roundNumber} manches` : `Fin de la manche ${game.roundNumber}`}
      </h2>
      <div className="my-1 sm:my-2">
        <ScoreTable
          players={game.players}
          userId={userId}
          variant="round"
          playAgain={finished ? playersPlayAgain : undefined}
        />
      </div>

      {finished ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isCreator && playersPlayAgain.length >= 2 ? (
            <button className="btn btn-primary btn-sm" onClick={handleNextRound} disabled={loading}>
              🔁 Nouvelle partie
            </button>
          ) : (
            <p className="mr-auto text-sm text-muted">
              {isCreator
                ? "Attends d'autres joueurs pour rejouer"
                : wantsToPlayAgain
                  ? "Le créateur va lancer une nouvelle partie"
                  : "Envie d'une revanche ?"}
            </p>
          )}
          <button
            className="btn btn-success btn-sm"
            onClick={handleRequestNewGame}
            disabled={wantsToPlayAgain || loading}
          >
            {wantsToPlayAgain ? "✅ Prêt" : "Ok pour rejouer"}
          </button>
          <Link to="/" className="btn btn-ghost btn-sm">
            Quitter
          </Link>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            className={`btn btn-sm ${isCreator ? "btn-primary" : ""}`}
            onClick={handleNextRound}
            disabled={!isCreator || loading}
          >
            {isCreator ? "Manche suivante" : "En attente du créateur"}
            {loading && <span className="loading loading-dots loading-xs"></span>}
          </button>
        </div>
      )}
    </section>
  );
};

export default RoundResults;
