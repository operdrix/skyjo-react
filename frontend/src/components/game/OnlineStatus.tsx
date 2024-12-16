
const OnlineStatus = ({ isConnected, sockerId, className }: {
    isConnected: boolean,
    sockerId?: string,
    className?: string
}) => {
    return (
        <>
            {isConnected &&
                <div className={`tooltip ${className}`} data-tip={sockerId}>
                    <div className="badge badge-success bg-green-500 text-white gap-2">
                        <span className="loading loading-ring loading-xs"></span>
                        En ligne
                    </div>
                </div>
            }
            {!isConnected &&
                <div className={`badge badge-error text-white gap-2 ${className}`}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="inline-block h-4 w-4 stroke-current">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Hors ligne
                </div>}
        </>
    )
}

export default OnlineStatus