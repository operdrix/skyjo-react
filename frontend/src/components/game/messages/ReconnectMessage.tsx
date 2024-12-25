export default function ReconnectMessage({ reconnect = true }: { reconnect?: boolean }) {
  return (
    <div className="flex-1 container mx-auto flex items-center">
      <div className="hero bg-base-200 min-h-[50vh] p-20">
        <div className="hero-content flex-col lg:flex-row text-center">
          {reconnect &&
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="md:size-96 max-w-sm text-warning">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          }
          <div>
            <h1 className="text-5xl font-bold text-title">
              {reconnect ? 'Tentative de reconnexion en cours' : 'Connexion en cours'}
            </h1>
            <p className="py-6 text-xl">
              Veuillez patienter... <br /><span className="loading loading-dots loading-lg text-warning"></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
