import { dismissToast, getToasts, subscribeToasts, type ToastType } from "@/lib/toast";
import { useSyncExternalStore } from "react";

const TONE: Record<ToastType, { color: string; icon: string }> = {
  info: { color: "bg-info text-info-content", icon: "i" },
  success: { color: "bg-success text-success-content", icon: "✓" },
  warning: { color: "bg-warning text-warning-content", icon: "!" },
  error: { color: "bg-error text-error-content", icon: "×" },
};

// Messages éphémères : en haut sur mobile, en bas à droite sur grand écran (monté hors du routeur)
const Toaster = () => {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[1000] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4 sm:items-end">
      {toasts.map(({ id, type, title, message }) => (
        <div
          key={id}
          role={type === "error" ? "alert" : "status"}
          className="toast-enter panel pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3 pr-2"
        >
          <span
            aria-hidden="true"
            className={`grid size-7 shrink-0 place-items-center rounded-full font-display font-bold ${TONE[type].color}`}
          >
            {TONE[type].icon}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            {title && <p className="font-display text-base font-bold">{title}</p>}
            <p>{message}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Fermer le message"
            onClick={() => dismissToast(id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;
