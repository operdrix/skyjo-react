import CardFan from "@/components/brand/CardFan";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { withRedirect } from "@/lib/redirect";
import { useUser } from "./hooks/User";
import { api } from "./services/apiService";

const FEATURES = [
  { title: "Salon privé", text: "Un lien à partager, et tes amis te rejoignent." },
  { title: "2 à 4 joueurs", text: "Sur téléphone, tablette ou ordinateur." },
  { title: "Ton historique", text: "Victoires, adversaires et meilleurs scores." },
];

function App() {
  const { loading: userLoading, isAuthentified } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    if (!userLoading && !isAuthentified) {
      navigate(withRedirect("/auth/login", window.location.pathname), {
        state: {
          message: {
            type: "info",
            message: "Vous devez être connecté pour créer une partie !",
            title: "Connexion requise",
          },
        },
      });
      return;
    }

    setLoading(true);

    const response = await api.post("game", { privateRoom: true });

    if (response.error) {
      // L'erreur 401 est gérée automatiquement par l'intercepteur
      setLoading(false);
    } else if (response.data) {
      navigate(`/join/${response.data.gameId}`);
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4">
      <section className="grid items-center gap-8 py-10 md:grid-cols-[1.15fr_1fr] md:py-16">
        <div>
          <h1 className="text-5xl leading-[1.04] font-bold sm:text-6xl">
            Retourne, échange,
            <br />
            fais le{" "}
            <span className="inline-block rounded-md border-2 border-line bg-accent px-2 text-accent-content shadow-[2px_2px_0_var(--line)]">
              plus petit
            </span>{" "}
            score.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Le jeu de cartes entre amis, en ligne et gratuit. Crée un salon, partage le lien, c'est parti.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={handleCreateGame} className="btn btn-primary btn-lg w-full sm:w-auto" disabled={loading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-6"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
              </svg>
              Créer une partie
            </button>
            <Link to={"/public-rooms"} className="btn btn-lg w-full sm:w-auto">
              Rejoindre une partie
            </Link>
          </div>
        </div>
        <CardFan className="mx-auto w-full max-w-sm" />
      </section>

      <section className="grid gap-4 pb-6 sm:grid-cols-3">
        {FEATURES.map(({ title, text }) => (
          <div key={title} className="panel p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default App;
