import ReconnectMessage from "@/components/game/messages/ReconnectMessage";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Create = () => {
  const { token, userId, logout, loading: userLoading } = useUser();
  const { socket, isConnected, loading: wbLoading } = useWebSocket()
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleCreateGame = async (privateRoom: boolean) => {
    setLoading(true);
    if (socket && isConnected) {
      try {
        const response = await fetch(`${process.env.VITE_BACKEND_HOST}/game`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: userId, privateRoom: privateRoom }),
        });
        const data = await response.json();
        if (response.ok) {
          navigate(`/join/${data.gameId}`)
        } else {
          console.error('Error:', data);
          if (response.status === 401) {
            logout();
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    }
    setLoading(false);
  }

  if (userLoading || wbLoading) {
    // Optionnel : Afficher un loader pendant la vérification de l'authentification
    return <ReconnectMessage reconnect={false} />;
  }

  return (
    <div className="flex-1 container mx-auto flex items-center">
      <div className="flex flex-col justify-center w-full">
        <div className="hero bg-base-200 sm:rounded-box min-h-[50vh]">
          <div className="hero-content text-center">
            <div className="max-w-lg">
              <h1
                className="text-5xl font-bold text-title font-courgette py-4"
              >
                Créez une partie !
              </h1>
              <p className="py-6 text-xl">
                Vous êtes prêt à jouer ? Cliquez sur le bouton ci-dessous pour créer une partie et inviter vos amis à vous rejoindre.
              </p>
              <p className="py-6 text-xl">
                Vous pourrez commencer la partie dès que tous les joueurs seront prêts.
              </p>
              <p className="flex flex-wrap justify-center gap-4">
                <div className="tooltip w-full sm:w-auto" data-tip="Partagez le lien avec vos amis seulement">
                  <button
                    className="btn btn-neutral w-full sm:w-auto bg-card-negative border-card-negative text-base-100"
                    disabled={loading}
                    onClick={() => handleCreateGame(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    Créer une partie privée
                    {loading &&
                      <span className="loading loading-ring loading-sm align-middle"></span>
                    }
                  </button>
                </div>
                <div className="tooltip w-full sm:w-auto" data-tip="Laissez les autres joueurs vous rejoindre">
                  <button
                    className="btn btn-neutral w-full sm:w-auto bg-card-green border-card-green text-base-100"
                    disabled={loading}
                    onClick={() => handleCreateGame(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    Créer une partie publique
                    {loading &&
                      <span className="loading loading-ring loading-sm align-middle"></span>
                    }
                  </button>
                </div>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Create

