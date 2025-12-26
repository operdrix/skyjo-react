import { api } from '@/services/apiService';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const VerifyEmail = () => {
    const { token } = useParams<string>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [errorMessage, setErrorMessage] = useState<string>('')
    const navigate = useNavigate()

    useEffect(() => {
        const verifyToken = async () => {
            const response = await api.get(`verify/${token}`);

            if (response.error) {
                setErrorMessage(response.error || 'La vérification a échoué');
            } else {
                navigate('/auth/login', {
                    state: {
                        message: {
                            title: 'Email vérifié',
                            message: 'Votre email a bien été vérifié, vous pouvez maintenant vous connecter',
                            type: 'success'
                        }
                    }
                });
            }

            setIsLoading(false);
        }

        verifyToken()
    }, [token, navigate])

    if (!token) {
        return (
            <div className="card shadow-lg compact side bg-base-100 text-base-content">
                <div className="card-body">
                    <h2 className="card-title">Invalid Token</h2>
                    <p>Invalid token. Please check the link in your email.</p>
                </div>
            </div>
        )
    }

    return (
        errorMessage ? (
            <div className="toast toast-center toast-middle">
                <div className=" alert alert-error">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 shrink-0 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMessage}</span>
                </div>
            </div>
        ) : isLoading ? (
            <span className="loading loading-ring loading-lg"></span>
        ) : null
    )
}

export default VerifyEmail