import FormError from "@/components/auth/FormError";
import CustomField from "@/components/forms/CustomField";
import { useUser } from "@/hooks/User";
import { authClient } from "@/lib/authClient";
import { authErrorMessage } from "@/lib/authErrors";
import { PSEUDO_MAX, PSEUDO_MIN, PSEUDO_PATTERN } from "@/lib/pseudo";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  username: yup
    .string()
    .trim()
    .min(PSEUDO_MIN, `${PSEUDO_MIN} caractères minimum`)
    .max(PSEUDO_MAX, `${PSEUDO_MAX} caractères maximum`)
    .matches(PSEUDO_PATTERN, "Lettres, chiffres, espace, point ou tiret uniquement")
    .required("Le pseudo est requis"),
});

// Après une première connexion Google : choix du pseudo, pré-rempli avec le prénom
function ChoosePseudo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { needsPseudo, isAuthentified, suggestedPseudo, loading, refresh } = useUser();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const redirect: string = location.state?.from || "/";

  if (!loading && !needsPseudo) {
    return <Navigate to={isAuthentified ? redirect : "/auth/login"} replace />;
  }

  const handleSubmit = async ({ username }: { username: string }) => {
    setErrorMessage("");
    const { error } = await authClient.updateUser({ username: username.trim() });
    if (error) {
      setErrorMessage(authErrorMessage(error));
      return;
    }
    refresh();
    navigate(redirect, { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-bold text-center text-2xl mb-2">Choisissez votre pseudo</h1>
        <p className="text-center mb-5">C'est le nom que verront les autres joueurs.</p>

        <Formik
          initialValues={{ username: suggestedPseudo }}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          <Form className="bg-base-200 shadow-sm rounded-lg px-5 py-7">
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
              Valider et jouer
            </button>
          </Form>
        </Formik>
      </div>
    </div>
  );
}

export default ChoosePseudo;
