// Badge salon privé / public ; un clic bascule (créateur seulement, vérifié par le serveur)
export default function PrivacyBadge({ isPrivate, onToggle }: { isPrivate: boolean; onToggle: () => void }) {
  return (
    <>
      {isPrivate ?
        <div
          className="tooltip tooltip-top cursor-pointer"
          data-tip='Seuls les joueurs ayant l&apos;URL peuvent rejoindre ce salon'
        >
          <div
            className='badge badge-neutral gap-2'
            onClick={onToggle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Salon privé
          </div>
        </div>
        :
        <div
          className="tooltip tooltip-top cursor-pointer"
          data-tip='Salon visible dans la liste des salons publics'
        >
          <div
            className='badge badge-accent gap-2'
            onClick={onToggle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Salon public
          </div>
        </div>
      }
    </>
  );
}
