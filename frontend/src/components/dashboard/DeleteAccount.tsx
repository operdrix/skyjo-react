import { useUser } from "@/hooks/User";
import { authClient } from "@/lib/authClient";
import { useState } from "react";
import { useNavigate } from "react-router";

// Droit à l'effacement : supprime le compte, ses parties créées et ses participations
const DeleteAccount = () => {
  const { refresh } = useUser();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    setDeleting(true);
    setError(null);
    const { error } = await authClient.deleteUser();
    setDeleting(false);
    if (error) {
      setError(
        error.code === "SESSION_EXPIRED"
          ? "Par sécurité, déconnectez-vous, reconnectez-vous puis réessayez."
          : "La suppression a échoué, réessayez plus tard.",
      );
      return;
    }
    refresh();
    navigate("/");
  };

  return (
    <section className="w-full max-w-xl my-8 p-4 border border-error/40 rounded-box space-y-2">
      <h2 className="text-lg font-bold">Supprimer mon compte</h2>
      <p className="text-sm opacity-80">
        Votre compte, votre email, les parties que vous avez créées et votre historique seront supprimés définitivement.
      </p>
      {error && <p className="text-sm text-error">{error}</p>}
      {confirming ? (
        <div className="flex gap-2">
          <button type="button" className="btn btn-error btn-sm" onClick={deleteAccount} disabled={deleting}>
            Oui, supprimer définitivement
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>
            Annuler
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-outline btn-error btn-sm" onClick={() => setConfirming(true)}>
          Supprimer mon compte
        </button>
      )}
    </section>
  );
};

export default DeleteAccount;
