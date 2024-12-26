import App from '@/App.tsx'
import AppLayout from '@/AppLayout.tsx'
import { UserProvider } from '@/context/UserContext.tsx'
import '@/index.css'
import AuthLayout from '@/pages/auth/AuthLayout.tsx'
import Login from '@/pages/auth/Login.tsx'
import Register from '@/pages/auth/Register.tsx'
import VerifyEmail from '@/pages/auth/VerifyEmail.tsx'
import Create from '@/pages/game/Create.tsx'
import Game from '@/pages/game/Game.tsx'
import GameLayout from '@/pages/game/GameLayout.tsx'
import JoinPublic from '@/pages/game/JoinPublic.tsx'
import WaitingRoom from '@/pages/game/WaitingRoom.tsx'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RequestResetPassword from './pages/auth/RequestResetPassword'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <App />
      }
    ]
  },
  {
    path: '/',
    element: <GameLayout />,
    children: [
      {
        // Lien pour créer une partie
        path: '/create',
        element: <Create />
      },
      {
        // Lien pour consulter les parties publiques
        path: '/public-rooms',
        element: <JoinPublic />
      },
      {
        // Salle de jeu
        path: '/game/:gameId',
        element: <Game />
      },
      {
        // Lien de la salle d'attente
        path: '/join/:gameId',
        element: <WaitingRoom />
      },


    ]
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: '/auth/login',
        element: <Login />
      },
      {
        path: '/auth/register',
        element: <Register />
      },
      {
        path: '/auth/verify/:token',
        element: <VerifyEmail />
      },
      {
        path: '/auth/request-reset-password',
        element: <RequestResetPassword />
      }
    ]
  }

])

createRoot(document.getElementById('root')!).render(
  <UserProvider>
    <RouterProvider router={router} />
  </UserProvider>
)
