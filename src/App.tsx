import { useNavigate } from "react-router-dom";
import { useUser } from "./hooks/User";

function App() {

  const { isAuthentified } = useUser();
  const navigate = useNavigate();

  const handleStartGame = () => {
    if (!isAuthentified) {
      navigate('/auth/login', {
        state: {
          message: {
            message: 'Vous devez être connecté pour commencer une partie',
            type: 'info',
            title: 'Connexion requise'
          },
          from: '/game'
        }
      });
    } else {
      navigate('/create');
    }
  }
  const handleJoinGame = () => {
    if (!isAuthentified) {
      navigate('/auth/login', {
        state: {
          message: {
            message: 'Vous devez être connecté pour commencer une partie',
            type: 'info',
            title: 'Connexion requise'
          },
          from: '/join'
        }
      });
    } else {
      navigate('/join');
    }
  }

  return (
    <div className="flex flex-col justify-center w-full">
      <div className="hero bg-base-200 rounded-box mt-5">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-700 via-yellow-300 to-red-500 bg-clip-text text-transparent">Bienvenue sur SkyJo online !</h1>
            <p className="py-6 text-xl">
              Jouez avec vos amis à SkyJo en ligne, gratuitement. Des heures de fun en perspective !
            </p>
            <p className="flex flex-row justify-center space-x-4">
              <button className="btn btn-accent text-white" onClick={handleStartGame}>Commencer une partie</button>
              <button className="btn btn-primary text-white" onClick={handleJoinGame}>Rejoindre une partie</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
