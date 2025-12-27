/* eslint-disable react-hooks/exhaustive-deps */

import Drawer from "@/components/nav/Drawer"
import Footer from "@/components/nav/Footer"
import Header from "@/components/nav/Header"
import { GameProvider } from "@/context/GameContext"
import { WebSocketProvider } from "@/context/WebSocketContext"
import { useUser } from "@/hooks/User"
import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

const GameLayout = () => {
  const { isAuthentified, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Vérifier si l'utilisateur est connecté au site
  useEffect(() => {
    if (!userLoading && !isAuthentified) {
      navigate('/auth/login', {
        state: {
          message: {
            type: 'info',
            message: 'Vous devez être connecté pour accéder à cette page',
            title: 'Connexion requise'
          },
          from: window.location.pathname
        }
      });
    }
  }, [isAuthentified, userLoading]);

  const isGamePage = location.pathname.startsWith('/game/');

  // Ne charger le WebSocket que si l'utilisateur est authentifié
  return (
    <WebSocketProvider 
      url={(process.env.VITE_BACKEND_WS as string)} 
      enabled={!userLoading && isAuthentified}
    >
      <GameProvider>
        <Drawer>
          <div className="flex flex-col min-h-screen font-kalam">
            {!isGamePage && <Header />}
            <Outlet />
            {!isGamePage && <Footer />}
          </div>
        </Drawer>
      </GameProvider>
    </WebSocketProvider>
  )
}

export default GameLayout