/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import Footer from "../components/nav/Footer"
import Header from "../components/nav/Header"
import { WebSocketProvider } from "../context/WebSocketContext"
import { useUser } from "../hooks/User"

const GameLayout = () => {
  const { isAuthentified, loading: userLoading } = useUser();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté au site
  useEffect(() => {
    if (!userLoading && !isAuthentified) {
      console.log('Game Layout: User not authentified');
      navigate('/auth/login', {
        state: {
          message: {
            type: 'info',
            message: 'Vous devez être connecté pour accéder à cette page' + window.location.pathname,
            title: 'Connexion requise'
          },
          from: window.location.pathname
        }
      });
    }
  }, [isAuthentified, userLoading]);

  return (
    <WebSocketProvider url={(process.env.BACKEND_HOST as string)}>
      <div className="flex flex-col min-h-screen font-kalam">
        <Header />
        <div className="flex-1 container mx-auto flex items-center">
          <Outlet />
        </div>
        <Footer />
      </div>
    </WebSocketProvider>
  )
}

export default GameLayout