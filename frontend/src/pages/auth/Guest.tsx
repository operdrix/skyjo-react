import FormError from "@/components/auth/FormError";
import CustomField from "@/components/forms/CustomField";
import { useUser } from "@/hooks/User";
import { authClient } from "@/lib/authClient";
import { authErrorMessage } from "@/lib/authErrors";
import { guestPseudo, pseudoSchema } from "@/lib/pseudo";
import { safeRedirect, withRedirect } from "@/lib/redirect";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  username: pseudoSchema,
});

// Jouer sans compte : avertissement, pseudo proposé et modifiable, puis retour à la partie visée
function Guest() {
  const [searchParams] = useSearchParams();
  const { isAuthentified, needsPseudo, refresh } = useUser();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [initialPseudo] = useState(() => guestPseudo());
  const redirect = safeRedirect(searchParams.get("redirect"));

  if (isAuthentified) {
    return <Navigate to={redirect} replace />;
  }

  const handleSubmit = async ({ username }: { username: string }) => {
    setErrorMessage("");
    // Session invité ouverte une seule fois : après un pseudo refusé, on ne change que le pseudo
    if (!needsPseudo) {
      const { error } = await authClient.signIn.anonymous();
      if (error) {
        setErrorMessage(authErrorMessage(error));
        return;
      }
    }
    const { error } = await authClient.updateUser({ username: username.trim() });
    if (error) {
      setErrorMessage(authErrorMessage(error));
      // La session invité existe désormais (sans pseudo)
      refresh();
      return;
    }
    // Une fois la session rechargée, le pseudo est connu et la page redirige d'elle-même
    refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="font-bold text-3xl mb-2">Jouer sans compte</h1>
        <p className="text-muted mb-5">Choisis ton pseudo et rejoins la partie.</p>

        <Formik initialValues={{ username: initialPseudo }} validationSchema={validationSchema} onSubmit={handleSubmit}>
          <Form className="panel px-5 py-7 sm:px-7">
            <ul className="text-sm mb-5 list-disc pl-5 space-y-1">
              <li>Tu n'auras pas d'historique de tes parties.</li>
              <li>Ta place est liée à ce navigateur : sur un autre appareil, tu ne la retrouveras pas.</li>
              <li>Sans visite pendant 7 jours, ton pseudo est libéré.</li>
            </ul>
            <FormError message={errorMessage} />
            <Field
              component={CustomField}
              id="username"
              name="username"
              label="Pseudo"
              autoComplete="nickname"
              autoFocus
            />
            <button type="submit" className="btn btn-primary w-full">
              Jouer
            </button>
          </Form>
        </Formik>

        <p className="text-sm text-center mt-5">
          Tu préfères garder tes parties ?{" "}
          <Link to={withRedirect("/auth/register", redirect)} className="link">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Guest;
