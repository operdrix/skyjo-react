/* eslint-disable react-hooks/exhaustive-deps */

import Drawer from "@/components/nav/Drawer";
import Footer from "@/components/nav/Footer";
import Header from "@/components/nav/Header";
import { GameProvider } from "@/context/GameProvider";
import { WebSocketProvider } from "@/context/WebSocketProvider";
import { goToLogin } from "@/lib/redirect";
import { useUser } from "@/hooks/User";
import { useEffect } from "react";
import RequirePseudo from "@/components/auth/RequirePseudo";
import { useLocation, useNavigate } from "react-router";

const GameLayout = () => {
  const { isAuthentified, needsPseudo, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Vérifier si l'utilisateur est connecté au site
  useEffect(() => {
    if (!userLoading && !isAuthentified && !needsPseudo) {
      goToLogin(navigate, window.location.pathname, "Connecte-toi pour rejoindre la partie.");
    }
  }, [isAuthentified, needsPseudo, userLoading]);

  const isGamePage = location.pathname.startsWith("/game/");

  // Ne charger le WebSocket que si l'utilisateur est authentifié
  return (
    <WebSocketProvider url={import.meta.env.VITE_BACKEND_WS as string} enabled={!userLoading && isAuthentified}>
      <GameProvider>
        <Drawer>
          <div className="flex flex-col min-h-screen">
            {!isGamePage && <Header />}
            <RequirePseudo />
            {!isGamePage && <Footer />}
          </div>
        </Drawer>
      </GameProvider>
    </WebSocketProvider>
  );
};

export default GameLayout;
