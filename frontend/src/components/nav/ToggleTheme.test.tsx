import ToggleTheme from "@/components/nav/ToggleTheme";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("ToggleTheme", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-theme");
  });

  it("part du mode enregistré et applique le thème", () => {
    localStorage.setItem("theme-mode", "sombre");
    render(<ToggleTheme />);
    expect(screen.getByRole("button", { name: /mode sombre/i })).toBeTruthy();
    expect(document.documentElement.dataset.theme).toBe("tapis-sombre");
    expect(document.documentElement.dataset.style).toBe("tapis");
  });

  it("passe au mode suivant au clic et l'enregistre", () => {
    localStorage.setItem("theme-mode", "clair");
    render(<ToggleTheme />);
    fireEvent.click(screen.getByRole("button", { name: /mode clair/i }));
    expect(screen.getByRole("button", { name: /mode sombre/i })).toBeTruthy();
    expect(document.documentElement.dataset.theme).toBe("tapis-sombre");
    expect(localStorage.getItem("theme-mode")).toBe("sombre");
  });

  it("reprend l'ancien réglage « dark »", () => {
    localStorage.setItem("theme", "dark");
    render(<ToggleTheme />);
    expect(screen.getByRole("button", { name: /mode sombre/i })).toBeTruthy();
  });
});
