import ThemePicker from "@/components/ThemePicker";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

describe("ThemePicker", () => {
  it("propose les trois thèmes et coche le thème choisi", () => {
    render(<ThemePicker value="tapis" onChange={vi.fn()} />);
    const group = screen.getByRole("radiogroup", { name: /thème/i });
    expect(group).toBeTruthy();
    expect(screen.getByRole("radio", { name: /tapis de jeu/i }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: /soirée néon/i }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("radio", { name: /confettis/i }).getAttribute("aria-checked")).toBe("false");
  });

  it("signale le thème cliqué", () => {
    const onChange = vi.fn();
    render(<ThemePicker value="tapis" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /soirée néon/i }));
    expect(onChange).toHaveBeenCalledWith("neon");
  });

  it("montre chaque aperçu dans son propre thème", () => {
    render(<ThemePicker value="tapis" onChange={vi.fn()} />);
    const neon = screen.getByRole("radio", { name: /soirée néon/i });
    expect(neon.querySelector("[data-style='neon']")?.getAttribute("data-theme")).toBe("neon");
  });
});
