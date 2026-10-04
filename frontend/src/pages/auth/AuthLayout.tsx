import CardFan from "@/components/brand/CardFan";
import AuthHeader from "@/components/nav/AuthHeader";
import Footer from "@/components/nav/Footer";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthHeader />
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-4 py-6 md:grid-cols-2">
        <aside className="panel-soft hidden h-full flex-col justify-center gap-6 p-10 md:flex">
          <h2 className="text-4xl leading-tight font-bold">
            Retourne, échange,
            <br />
            fais le plus petit score.
          </h2>
          <p className="text-lg text-muted">Crée un salon, partage le lien, jouez de 2 à 4.</p>
          <CardFan />
        </aside>
        <div className="flex flex-col">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
