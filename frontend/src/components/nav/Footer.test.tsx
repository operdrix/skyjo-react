import Footer from "@/components/nav/Footer";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("Footer", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("affiche le numéro de version de la release", () => {
    vi.stubEnv("VITE_APP_VERSION", "3.0.0");
    render(<Footer />);
    expect(screen.getByText("v3.0.0")).toBeTruthy();
  });

  it("affiche « dev » hors release", () => {
    vi.stubEnv("VITE_APP_VERSION", "");
    render(<Footer />);
    expect(screen.getByText("dev")).toBeTruthy();
  });
});
