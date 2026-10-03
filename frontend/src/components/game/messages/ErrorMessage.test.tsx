import ErrorMessage from "@/components/game/messages/ErrorMessage";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/notify", () => ({ default: vi.fn() }));

afterEach(cleanup);

describe("ErrorMessage", () => {
  it("s'affiche hors d'une partie (historique, sans GameProvider)", () => {
    render(<ErrorMessage error="Suppression impossible" />);

    expect(screen.getByText("Suppression impossible")).toBeTruthy();
  });
});
