import RequirePseudo from '@/components/auth/RequirePseudo';
import ChoosePseudo from '@/pages/auth/ChoosePseudo';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authClient = vi.hoisted(() => ({
  signIn: { social: vi.fn(), email: vi.fn() },
  signUp: { email: vi.fn() },
  updateUser: vi.fn(),
}));
const user = vi.hoisted(() => ({
  current: { isAuthentified: false, needsPseudo: false, userName: null as string | null, suggestedPseudo: '', loading: false, refresh: vi.fn() },
}));

vi.mock('@/lib/authClient', () => ({ authClient }));
vi.mock('@/hooks/User', () => ({ useUser: () => user.current }));

// jsdom n'implémente pas <dialog>
HTMLDialogElement.prototype.showModal ??= vi.fn();
HTMLDialogElement.prototype.close ??= vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  authClient.signUp.email.mockResolvedValue({ data: {}, error: null });
  authClient.signIn.email.mockResolvedValue({ data: {}, error: null });
  authClient.updateUser.mockResolvedValue({ data: {}, error: null });
  authClient.signIn.social.mockResolvedValue({ data: {}, error: null });
  user.current = { isAuthentified: false, needsPseudo: false, userName: null, suggestedPseudo: '', loading: false, refresh: vi.fn() };
});

afterEach(cleanup);

const renderAt = (element: React.ReactNode) => render(<MemoryRouter>{element}</MemoryRouter>);

describe('connexion', () => {
  it('propose Google en premier, le formulaire email seulement sur demande', () => {
    renderAt(<Login />);

    fireEvent.click(screen.getByRole('button', { name: /continuer avec google/i }));
    expect(authClient.signIn.social).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
    expect(screen.queryByLabelText(/mot de passe/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /avec un email/i }));
    expect(screen.getByLabelText(/mot de passe/i)).toBeTruthy();
  });
});

describe('bouton Google', () => {
  it("affiche une erreur si la connexion Google n'aboutit pas", async () => {
    authClient.signIn.social.mockResolvedValue({ data: null, error: { code: 'PROVIDER_NOT_FOUND' } });
    renderAt(<Login />);

    fireEvent.click(screen.getByRole('button', { name: /continuer avec google/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});

describe('inscription', () => {
  it("ne demande que l'email, le pseudo et le mot de passe", async () => {
    renderAt(<Register />);

    expect(screen.getByRole('button', { name: /continuer avec google/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /avec un email/i }));
    expect(screen.queryByLabelText(/nom/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'lea@test.local' } });
    fireEvent.change(screen.getByLabelText(/pseudo/i), { target: { value: 'Léa' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'secret-de-test' } });
    fireEvent.click(screen.getByRole('button', { name: /jouer/i }));

    await waitFor(() => expect(authClient.signUp.email).toHaveBeenCalledWith({
      email: 'lea@test.local', password: 'secret-de-test', name: 'Léa', username: 'Léa',
    }));
  });
});

describe('choix du pseudo après Google', () => {
  it('propose le prénom Google et enregistre le pseudo choisi', async () => {
    user.current = { ...user.current, isAuthentified: false, needsPseudo: true, suggestedPseudo: 'Marie' };
    renderAt(<ChoosePseudo />);

    const input = screen.getByLabelText(/pseudo/i) as HTMLInputElement;
    expect(input.value).toBe('Marie');
    fireEvent.click(screen.getByRole('button', { name: /jouer/i }));

    await waitFor(() => expect(authClient.updateUser).toHaveBeenCalledWith({ username: 'Marie' }));
  });
});

describe('garde du pseudo', () => {
  it('envoie vers le choix du pseudo un joueur connecté sans pseudo', () => {
    user.current = { ...user.current, needsPseudo: true };
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route element={<RequirePseudo />}>
            <Route path="/create" element={<p>création</p>} />
          </Route>
          <Route path="/auth/pseudo" element={<p>choix du pseudo</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('choix du pseudo')).toBeTruthy();
  });
});
