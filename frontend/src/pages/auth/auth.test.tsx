import RequirePseudo from "@/components/auth/RequirePseudo";
import ChoosePseudo from "@/pages/auth/ChoosePseudo";
import Guest from "@/pages/auth/Guest";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authClient = vi.hoisted(() => ({
  signIn: { social: vi.fn(), email: vi.fn(), anonymous: vi.fn() },
  signUp: { email: vi.fn() },
  updateUser: vi.fn(),
}));
const user = vi.hoisted(() => ({
  current: {
    isAuthentified: false,
    isGuest: false,
    needsPseudo: false,
    userName: null as string | null,
    suggestedPseudo: "",
    loading: false,
    refresh: vi.fn(),
  },
}));

vi.mock("@/lib/authClient", () => ({ authClient }));
vi.mock("@/hooks/User", () => ({ useUser: () => user.current }));

// jsdom n'implémente pas <dialog>
HTMLDialogElement.prototype.showModal ??= vi.fn();
HTMLDialogElement.prototype.close ??= vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  authClient.signUp.email.mockResolvedValue({ data: {}, error: null });
  authClient.signIn.email.mockResolvedValue({ data: {}, error: null });
  authClient.updateUser.mockResolvedValue({ data: {}, error: null });
  authClient.signIn.social.mockResolvedValue({ data: {}, error: null });
  authClient.signIn.anonymous.mockResolvedValue({ data: {}, error: null });
  user.current = {
    isAuthentified: false,
    isGuest: false,
    needsPseudo: false,
    userName: null,
    suggestedPseudo: "",
    loading: false,
    refresh: vi.fn(),
  };
});

afterEach(cleanup);

// Page d'authentification ouverte depuis un lien de partie (/join/42)
const renderWithGame = (path: string, element: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path.split("?")[0]} element={element} />
        <Route path="/join/42" element={<p>salle d'attente</p>} />
        <Route path="/" element={<p>accueil</p>} />
      </Routes>
    </MemoryRouter>,
  );

const renderAt = (element: React.ReactNode) => render(<MemoryRouter>{element}</MemoryRouter>);

describe("connexion", () => {
  it("propose Google en premier, le formulaire email seulement sur demande", () => {
    renderAt(<Login />);

    fireEvent.click(screen.getByRole("button", { name: /continuer avec google/i }));
    expect(authClient.signIn.social).toHaveBeenCalledWith(expect.objectContaining({ provider: "google" }));
    expect(screen.queryByLabelText(/mot de passe/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /avec un email/i }));
    expect(screen.getByLabelText(/mot de passe/i)).toBeTruthy();
  });
});

describe("jouer sans compte", () => {
  it("propose de rejoindre sans compte depuis la connexion, en gardant la partie visée", () => {
    renderWithGame("/auth/login?redirect=%2Fjoin%2F42", <Login />);

    const link = screen.getByRole("link", { name: /rejoindre sans compte/i });
    expect(link.getAttribute("href")).toBe("/auth/invite?redirect=%2Fjoin%2F42");
  });

  it("prévient l'invité de ce qu'il perd et lui propose un pseudo modifiable", () => {
    renderWithGame("/auth/invite?redirect=%2Fjoin%2F42", <Guest />);

    expect(screen.getByText(/historique/i)).toBeTruthy();
    expect(screen.getByText(/navigateur/i)).toBeTruthy();
    expect(screen.getByText(/7 jours/i)).toBeTruthy();
    const pseudo = screen.getByLabelText(/pseudo/i) as HTMLInputElement;
    expect(pseudo.value.length).toBeGreaterThanOrEqual(3);
  });

  it("crée la session invité avec le pseudo choisi", async () => {
    renderWithGame("/auth/invite?redirect=%2Fjoin%2F42", <Guest />);

    fireEvent.change(screen.getByLabelText(/pseudo/i), { target: { value: "Léa" } });
    fireEvent.click(screen.getByRole("button", { name: /jouer/i }));

    await waitFor(() => expect(user.current.refresh).toHaveBeenCalled());
    expect(authClient.signIn.anonymous).toHaveBeenCalled();
    expect(authClient.updateUser).toHaveBeenCalledWith({ username: "Léa" });
  });

  it("garde la session invité déjà ouverte quand le pseudo était refusé", async () => {
    user.current = { ...user.current, needsPseudo: true };
    authClient.updateUser.mockResolvedValueOnce({ data: null, error: { code: "USERNAME_IS_ALREADY_TAKEN" } });
    renderWithGame("/auth/invite?redirect=%2Fjoin%2F42", <Guest />);

    fireEvent.click(screen.getByRole("button", { name: /jouer/i }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(authClient.signIn.anonymous).not.toHaveBeenCalled();
  });

  it("renvoie vers la partie visée une fois le pseudo choisi", () => {
    user.current = { ...user.current, isAuthentified: true, userName: "Léa" };
    renderWithGame("/auth/invite?redirect=%2Fjoin%2F42", <Guest />);

    expect(screen.getByText("salle d'attente")).toBeTruthy();
  });
});

describe("inscription d'un invité", () => {
  it("laisse un invité ouvrir la page d'inscription", () => {
    user.current = { ...user.current, isAuthentified: true, isGuest: true, userName: "Lynx 42" };
    renderAt(<Register />);

    expect(screen.getByRole("heading", { name: "Créer un compte" })).toBeTruthy();
  });
});

describe("bouton Google", () => {
  it("affiche une erreur si la connexion Google n'aboutit pas", async () => {
    authClient.signIn.social.mockResolvedValue({ data: null, error: { code: "PROVIDER_NOT_FOUND" } });
    renderAt(<Login />);

    fireEvent.click(screen.getByRole("button", { name: /continuer avec google/i }));

    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});

describe("inscription", () => {
  it("ne demande que l'email, le pseudo et le mot de passe", async () => {
    renderAt(<Register />);

    expect(screen.getByRole("button", { name: /continuer avec google/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /avec un email/i }));
    expect(screen.queryByLabelText(/nom/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: "lea@test.local" } });
    fireEvent.change(screen.getByLabelText(/pseudo/i), { target: { value: "Léa" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "secret-de-test" } });
    fireEvent.click(screen.getByRole("button", { name: /jouer/i }));

    await waitFor(() =>
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: "lea@test.local",
        password: "secret-de-test",
        name: "Léa",
        username: "Léa",
        theme: "tapis",
      }),
    );
  });

  it("fait choisir le thème, appliqué tout de suite et enregistré avec le compte", async () => {
    renderAt(<Register />);
    fireEvent.click(screen.getByRole("button", { name: /avec un email/i }));

    fireEvent.click(screen.getByRole("radio", { name: /soirée néon/i }));
    expect(document.documentElement.dataset.theme).toBe("neon");

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: "lea@test.local" } });
    fireEvent.change(screen.getByLabelText(/pseudo/i), { target: { value: "Léa" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "secret-de-test" } });
    fireEvent.click(screen.getByRole("button", { name: /jouer/i }));

    await waitFor(() =>
      expect(authClient.signUp.email).toHaveBeenCalledWith(expect.objectContaining({ theme: "neon" })),
    );
  });
});

describe("choix du pseudo après Google", () => {
  it("propose le prénom Google et enregistre le pseudo choisi", async () => {
    user.current = { ...user.current, isAuthentified: false, needsPseudo: true, suggestedPseudo: "Marie" };
    renderAt(<ChoosePseudo />);

    const input = screen.getByLabelText(/pseudo/i) as HTMLInputElement;
    expect(input.value).toBe("Marie");
    fireEvent.click(screen.getByRole("button", { name: /jouer/i }));

    await waitFor(() => expect(authClient.updateUser).toHaveBeenCalledWith({ username: "Marie", theme: "tapis" }));
  });

  it("fait aussi choisir le thème", async () => {
    user.current = { ...user.current, isAuthentified: false, needsPseudo: true, suggestedPseudo: "Marie" };
    renderAt(<ChoosePseudo />);

    fireEvent.click(screen.getByRole("radio", { name: /confettis/i }));
    expect(document.documentElement.dataset.theme).toMatch(/^confettis/);
    fireEvent.click(screen.getByRole("button", { name: /jouer/i }));

    await waitFor(() => expect(authClient.updateUser).toHaveBeenCalledWith({ username: "Marie", theme: "confettis" }));
  });
});

describe("garde du pseudo", () => {
  it("envoie vers le choix du pseudo un joueur connecté sans pseudo", () => {
    user.current = { ...user.current, needsPseudo: true };
    render(
      <MemoryRouter initialEntries={["/create"]}>
        <Routes>
          <Route element={<RequirePseudo />}>
            <Route path="/create" element={<p>création</p>} />
          </Route>
          <Route path="/auth/pseudo" element={<p>choix du pseudo</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("choix du pseudo")).toBeTruthy();
  });
});

describe("retour à la partie après connexion", () => {
  it("connexion par email : ouvre la salle d'attente une fois la session chargée", async () => {
    const { rerender } = renderWithGame("/auth/login?redirect=%2Fjoin%2F42", <Login />);

    fireEvent.click(screen.getByRole("button", { name: /avec un email/i }));
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: "lea@test.local" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "secret-de-test" } });
    fireEvent.click(screen.getByRole("button", { name: /me connecter/i }));
    await waitFor(() => expect(user.current.refresh).toHaveBeenCalled());
    // Session pas encore rechargée : on reste sur la connexion
    expect(screen.queryByText("salle d'attente")).toBeNull();

    user.current = { ...user.current, isAuthentified: true, userName: "Léa" };
    rerender(
      <MemoryRouter initialEntries={["/auth/login?redirect=%2Fjoin%2F42"]}>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/join/42" element={<p>salle d'attente</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("salle d'attente")).toBeTruthy();
  });

  it("inscription par email : ouvre la salle d'attente une fois connecté", () => {
    user.current = { ...user.current, isAuthentified: true, userName: "Léa" };
    renderWithGame("/auth/register?redirect=%2Fjoin%2F42", <Register />);

    expect(screen.getByText("salle d'attente")).toBeTruthy();
  });

  it("ignore une adresse de retour externe", () => {
    user.current = { ...user.current, isAuthentified: true, userName: "Léa" };
    renderWithGame("/auth/login?redirect=https%3A%2F%2Fexemple.test", <Login />);

    expect(screen.getByText("accueil")).toBeTruthy();
  });

  it("garde la partie en passant de la connexion à l'inscription et inversement", () => {
    renderWithGame("/auth/login?redirect=%2Fjoin%2F42", <Login />);
    expect(screen.getByRole("link", { name: /créer un compte/i }).getAttribute("href")).toBe(
      "/auth/register?redirect=%2Fjoin%2F42",
    );
    cleanup();

    renderWithGame("/auth/register?redirect=%2Fjoin%2F42", <Register />);
    expect(screen.getByRole("link", { name: /me connecter/i }).getAttribute("href")).toBe(
      "/auth/login?redirect=%2Fjoin%2F42",
    );
  });

  it("Google : revient sur la partie, en passant par le choix du pseudo pour un nouveau joueur", () => {
    renderWithGame("/auth/register?redirect=%2Fjoin%2F42", <Register />);

    fireEvent.click(screen.getByRole("button", { name: /continuer avec google/i }));
    expect(authClient.signIn.social).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: `${window.location.origin}/join/42`,
        newUserCallbackURL: `${window.location.origin}/auth/pseudo?redirect=%2Fjoin%2F42`,
      }),
    );
  });

  it("choix du pseudo : ouvre la partie une fois le pseudo enregistré", () => {
    user.current = { ...user.current, isAuthentified: true, userName: "Marie" };
    renderWithGame("/auth/pseudo?redirect=%2Fjoin%2F42", <ChoosePseudo />);

    expect(screen.getByText("salle d'attente")).toBeTruthy();
  });

  it("garde du pseudo : transmet la partie au choix du pseudo", () => {
    user.current = { ...user.current, needsPseudo: true };
    const ShowSearch = () => <p>{useLocation().search}</p>;
    render(
      <MemoryRouter initialEntries={["/join/42"]}>
        <Routes>
          <Route element={<RequirePseudo />}>
            <Route path="/join/42" element={<p>salle d'attente</p>} />
          </Route>
          <Route path="/auth/pseudo" element={<ShowSearch />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("?redirect=%2Fjoin%2F42")).toBeTruthy();
  });
});
