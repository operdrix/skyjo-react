/* eslint-disable react-hooks/exhaustive-deps */

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
      console.log('Game Layout: User not authentified');
      navigate('/auth/login', {
        state: {
          message: {
            type: 'info',
            message: 'Vous devez être connecté pour accéder à cette page', // + window.location.pathname,
            title: 'Connexion requise'
          },
          from: window.location.pathname
        }
      });
    }
  }, [isAuthentified, userLoading]);

  const isGamePage = location.pathname.startsWith('/game/');

  return (
    <WebSocketProvider url={(process.env.VITE_BACKEND_WS as string)}>
      <GameProvider>
        <div className="flex flex-col min-h-screen font-kalam">
          {!isGamePage && <Header />}
          <Outlet />
          {!isGamePage && <Footer />}
        </div>
      </GameProvider>
    </WebSocketProvider>
  )
}

export default GameLayout