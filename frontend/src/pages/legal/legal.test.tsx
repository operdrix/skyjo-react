import Footer from "@/components/nav/Footer";
import Cookies from "@/pages/legal/Cookies";
import LegalNotice from "@/pages/legal/LegalNotice";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import Terms from "@/pages/legal/Terms";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

function renderPage(element: React.ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

const text = () => document.body.textContent ?? "";

describe("pages légales", () => {
  afterEach(cleanup);

  it("le footer renvoie vers les quatre documents, sans société fictive", () => {
    renderPage(<Footer />);

    expect(screen.getByRole("link", { name: "Mentions légales" }).getAttribute("href")).toBe("/mentions-legales");
    expect(screen.getByRole("link", { name: "Confidentialité" }).getAttribute("href")).toBe("/privacy");
    expect(screen.getByRole("link", { name: "Conditions d'utilisation" }).getAttribute("href")).toBe("/cgu");
    expect(screen.getByRole("link", { name: "Cookies" }).getAttribute("href")).toBe("/cookies");
    expect(text()).not.toContain("Perdrix Industries");
  });

  it("mentions légales : éditeur particulier et hébergeur", () => {
    renderPage(<LegalNotice />);

    expect(screen.getByRole("heading", { level: 1, name: "Mentions légales" })).toBeTruthy();
    expect(text()).toContain("Hostinger International Limited");
    expect(text()).toContain("Larnaca");
    expect(screen.getByRole("link", { name: "formulaire de contact" }).getAttribute("href")).toBe(
      "https://www.hostinger.com/fr/contact",
    );
    expect(text()).toContain("olivierperdrix@live.fr");
  });

  it("politique de confidentialité : responsable, conservation, droits et CNIL", () => {
    renderPage(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Politique de confidentialité" })).toBeTruthy();
    expect(text()).toContain("Olivier Perdrix");
    expect(text()).toContain("3 ans");
    expect(text()).toContain("adresse IP");
    expect(screen.getByRole("link", { name: /cnil\.fr/ }).getAttribute("href")).toContain("cnil.fr");
  });

  it("conditions d'utilisation", () => {
    renderPage(<Terms />);

    expect(screen.getByRole("heading", { level: 1, name: "Conditions générales d'utilisation" })).toBeTruthy();
    expect(text()).toContain("Magilano");
  });

  it("cookies : uniquement des traceurs exemptés de consentement", () => {
    renderPage(<Cookies />);

    expect(screen.getByRole("heading", { level: 1, name: "Cookies et traceurs" })).toBeTruthy();
    expect(text()).toContain("better-auth.session_token");
    expect(text()).toContain("exemptés de consentement");
  });

  it("cookies : liste les clés de stockage local du thème", () => {
    renderPage(<Cookies />);

    expect(screen.getByRole("cell", { name: "theme-style" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "theme-mode" })).toBeTruthy();
    expect(screen.queryByRole("cell", { name: "theme" })).toBeNull();
  });
});
