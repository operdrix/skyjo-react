// Messages éphémères : petit magasin hors React, utilisable juste avant une navigation
// (le composant Toaster est monté au-dessus du routeur, le message survit au changement de page).

export type ToastType = "info" | "success" | "warning" | "error";
export type Toast = { id: number; type: ToastType; title?: string; message: string };

const DURATION: Record<ToastType, number> = { info: 5000, success: 5000, warning: 8000, error: 8000 };
const MAX_TOASTS = 3;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const emit = () => listeners.forEach((listener) => listener());

export function toast(input: Omit<Toast, "id">): number {
  // Même message déjà affiché (double clic, double redirection) : pas de doublon
  const duplicate = toasts.find((t) => t.type === input.type && t.message === input.message);
  if (duplicate) return duplicate.id;

  const id = nextId++;
  toasts = [...toasts, { id, ...input }];
  while (toasts.length > MAX_TOASTS) dismissToast(toasts[0].id, false);
  timers.set(
    id,
    setTimeout(() => dismissToast(id), DURATION[input.type]),
  );
  emit();
  return id;
}

export function dismissToast(id: number, notify = true): void {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts = toasts.filter((t) => t.id !== id);
  if (notify) emit();
}

export function getToasts(): Toast[] {
  return toasts;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
