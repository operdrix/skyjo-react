import FormError from "@/components/auth/FormError";
import { authClient } from "@/lib/authClient";
import { withRedirect } from "@/lib/redirect";
import { useState } from "react";

// Connexion ou inscription en un clic ; un nouveau joueur passe ensuite par le choix du pseudo
export default function GoogleButton({ redirect = "/" }: { redirect?: string }) {
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleClick = async () => {
    setErrorMessage("");
    const origin = window.location.origin;
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${origin}${redirect}`,
      newUserCallbackURL: `${origin}${withRedirect("/auth/pseudo", redirect)}`,
      errorCallbackURL: `${origin}/auth/login`,
    });
    if (error) {
      setErrorMessage(
        "La connexion avec Google est indisponible pour le moment, utilisez un email et un mot de passe.",
      );
    }
  };

  return (
    <>
      <FormError message={errorMessage} />
      <button type="button" onClick={handleClick} className="btn btn-lg w-full bg-white text-[#1f1a33]">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 512 512">
          <path fill="#fff" d="M0 0h512v512H0z" />
          <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341" />
          <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57" />
          <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73" />
          <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55" />
        </svg>
        Continuer avec Google
      </button>
    </>
  );
}
