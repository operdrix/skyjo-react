import Toaster from "@/components/Toaster";
import { dismissToast, getToasts, toast } from "@/lib/toast";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  cleanup();
  getToasts().forEach((t) => dismissToast(t.id));
});

describe("Toaster", () => {
  it("affiche un message avec son titre, annoncé aux lecteurs d'écran", () => {
    render(<Toaster />);
    act(() => {
      toast({ type: "info", title: "Connexion requise", message: "Connecte-toi pour jouer" });
    });
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Connexion requise");
    expect(status.textContent).toContain("Connecte-toi pour jouer");
  });

  it("annonce les erreurs comme des alertes", () => {
    render(<Toaster />);
    act(() => {
      toast({ type: "error", message: "La partie est pleine" });
    });
    expect(screen.getByRole("alert").textContent).toContain("La partie est pleine");
  });

  it("se ferme avec la croix", () => {
    render(<Toaster />);
    act(() => {
      toast({ type: "success", message: "Partie créée" });
    });
    fireEvent.click(screen.getByRole("button", { name: /fermer le message/i }));
    expect(screen.queryByText("Partie créée")).toBeNull();
  });
});
