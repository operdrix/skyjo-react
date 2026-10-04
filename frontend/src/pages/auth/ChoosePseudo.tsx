import FormError from "@/components/auth/FormError";
import CustomField from "@/components/forms/CustomField";
import ThemeField from "@/components/forms/ThemeField";
import { useUser } from "@/hooks/User";
import { authClient } from "@/lib/authClient";
import { authErrorMessage } from "@/lib/authErrors";
import { safeRedirect } from "@/lib/redirect";
import { pseudoSchema } from "@/lib/pseudo";
import { readThemePrefs, type ThemeStyle } from "@/lib/theme";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  username: pseudoSchema,
});

// Après une première connexion Google : choix du pseudo, pré-rempli avec le prénom
function ChoosePseudo() {
  const [searchParams] = useSearchParams();
  const { needsPseudo, isAuthentified, suggestedPseudo, loading, refresh } = useUser();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const redirect = safeRedirect(searchParams.get("redirect"));

  if (!loading && !needsPseudo) {
    return <Navigate to={isAuthentified ? redirect : "/auth/login"} replace />;
  }

  const handleSubmit = async ({ username, theme }: { username: string; theme: ThemeStyle }) => {
    setErrorMessage("");
    const { error } = await authClient.updateUser({ username: username.trim(), theme });
    if (error) {
      setErrorMessage(authErrorMessage(error));
      return;
    }
    // Une fois la session rechargée, le pseudo est connu et la page redirige d'elle-même
    refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="font-bold text-3xl mb-2">Choisissez votre pseudo</h1>
        <p className="text-muted mb-5">C'est le nom que verront les autres joueurs.</p>

        <Formik
          initialValues={{ username: suggestedPseudo, theme: readThemePrefs(localStorage).style }}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          <Form className="panel px-5 py-7 sm:px-7">
            <FormError message={errorMessage} />
            <Field
              component={CustomField}
              id="username"
              name="username"
              label="Pseudo"
              autoComplete="nickname"
              autoFocus
            />
            <ThemeField />
            <button type="submit" className="btn btn-primary w-full">
              Valider et jouer
            </button>
          </Form>
        </Formik>
      </div>
    </div>
  );
}

export default ChoosePseudo;
