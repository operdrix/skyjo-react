const WaitingDeal = () => {
  return (
    <div className="flex-1 container mx-auto flex items-center">
      <div className="hero bg-base-200 min-h-[50vh] sm:p-20">
        <div className="hero-content flex-col lg:flex-row text-center">
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" enableBackground="new 0 0 64 64" stroke="currentColor" className="md:size-96 max-w-sm text-success">
            <polygon fill="none" strokeWidth="2" strokeMiterlimit="10" points="44,59 16,45 36,5 63,19 " />
            <polyline fill="none" strokeWidth="2" strokeMiterlimit="10" points="31.899,14.004 28,6 1,20 19,59 32,52.964" />
            <line fill="none" strokeWidth="2" strokeMiterlimit="10" x1="38" y1="9" x2="37" y2="11" />
            <line fill="none" strokeWidth="2" strokeMiterlimit="10" x1="7" y1="23" x2="6" y2="21" />
            <line fill="none" strokeWidth="2" strokeMiterlimit="10" x1="43" y1="53" x2="42" y2="55" />
            <path fill="none" strokeWidth="2" strokeMiterlimit="10" d="M33,25c-2.848,5.281,3,15,3,15s11.151,0.28,14-5c1.18-2.188,1.377-5.718-1-7c-2.188-1.18-5.82-1.188-7,1c1.18-2.188,0.188-4.82-2-6C37.624,21.718,34.181,22.813,33,25z" />
          </svg>
          <div>
            <h1 className="text-5xl font-bold">
              Nouvelle manche
            </h1>
            <p className="py-6 text-xl">
              Mélange des cartes en cours ... <br /><span className="loading loading-dots loading-lg text-success"></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaitingDeal