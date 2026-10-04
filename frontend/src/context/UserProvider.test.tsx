import { UserProvider } from "@/context/UserProvider";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@/lib/authClient", () => ({
  authClient: {
    useSession: () => ({ data: session.current, isPending: false, refetch: vi.fn() }),
    signOut: vi.fn(),
  },
}));

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const connectedAs = (theme: string) => {
  session.current = { user: { id: "u1", username: "alice", email: "a@test.local", name: "alice", theme } };
};

describe("UserProvider", () => {
  it("applique le thème du compte et met à jour la copie locale", () => {
    localStorage.setItem("theme-style", "tapis");
    connectedAs("neon");
    render(<UserProvider>contenu</UserProvider>);
    expect(localStorage.getItem("theme-style")).toBe("neon");
    expect(document.documentElement.dataset.theme).toBe("neon");
  });

  it("ignore un thème inconnu", () => {
    localStorage.setItem("theme-style", "confettis");
    connectedAs("cupcake");
    render(<UserProvider>contenu</UserProvider>);
    expect(localStorage.getItem("theme-style")).toBe("confettis");
  });

  it("garde la copie locale sans session", () => {
    localStorage.setItem("theme-style", "confettis");
    session.current = null;
    render(<UserProvider>contenu</UserProvider>);
    expect(localStorage.getItem("theme-style")).toBe("confettis");
  });
});
