import { Link } from "react-router-dom";

function App() {

  return (
    <div className="flex-1 container mx-auto flex items-center">
      <div className="flex flex-col justify-center w-full">
        <div className="hero bg-base-200 sm:rounded-box min-h-[50vh]">
          <div className="hero-content text-center">
            <div className="max-w-lg">
              <img
                src="/images/logo.svg"
                alt="SkyJo"
                className="mx-auto"
              />
              <h1
                className="text-5xl font-bold text-title font-courgette py-4"
              >
                Bienvenue sur le Skyjo d'Olivier !
              </h1>
              <p className="py-6 text-xl">
                Jouez avec vos amis à SkyJo en ligne, gratuitement.<br />Des heures de fun en perspective !
              </p>
              <p className="flex flex-wrap justify-center gap-4">
                <Link
                  to={'/create'}
                  className="btn btn-neutral w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>

                  Créer une partie
                </Link>
                <Link
                  to={'/public-rooms'}
                  className="btn btn-neutral w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                  Rejoindre une partie
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
