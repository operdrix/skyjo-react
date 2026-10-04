import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dismissToast, getToasts, subscribeToasts, toast } from "@/lib/toast";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  getToasts().forEach((t) => dismissToast(t.id));
  vi.useRealTimers();
});

describe("messages éphémères", () => {
  it("ajoute un message et prévient les abonnés", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);

    toast({ type: "info", title: "Connexion requise", message: "Connecte-toi pour jouer" });

    expect(getToasts()).toMatchObject([
      { type: "info", title: "Connexion requise", message: "Connecte-toi pour jouer" },
    ]);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("disparaît tout seul après quelques secondes", () => {
    toast({ type: "success", message: "Partie créée" });
    vi.advanceTimersByTime(4999);
    expect(getToasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(getToasts()).toHaveLength(0);
  });

  it("laisse plus de temps aux erreurs", () => {
    toast({ type: "error", message: "La partie est pleine" });
    vi.advanceTimersByTime(5000);
    expect(getToasts()).toHaveLength(1);
    vi.advanceTimersByTime(3000);
    expect(getToasts()).toHaveLength(0);
  });

  it("se ferme à la demande", () => {
    const id = toast({ type: "info", message: "Bonjour" });
    dismissToast(id);
    expect(getToasts()).toHaveLength(0);
  });

  it("n'affiche pas deux fois le même message à la suite", () => {
    toast({ type: "info", message: "Connecte-toi pour jouer" });
    toast({ type: "info", message: "Connecte-toi pour jouer" });
    expect(getToasts()).toHaveLength(1);
  });

  it("garde au plus trois messages", () => {
    ["un", "deux", "trois", "quatre"].forEach((message) => toast({ type: "info", message }));
    expect(getToasts().map((t) => t.message)).toEqual(["deux", "trois", "quatre"]);
  });
});
