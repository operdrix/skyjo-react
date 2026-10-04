import Footer from "@/components/nav/Footer";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("Footer", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("affiche le numéro de version de la release", () => {
    vi.stubEnv("VITE_APP_VERSION", "3.0.0");
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByText("v3.0.0")).toBeTruthy();
  });

  it("affiche « dev » hors release", () => {
    vi.stubEnv("VITE_APP_VERSION", "");
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByText("dev")).toBeTruthy();
  });
});
