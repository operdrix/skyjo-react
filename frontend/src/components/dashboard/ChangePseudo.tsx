import FormError from "@/components/auth/FormError";
import CustomField from "@/components/forms/CustomField";
import { useUser } from "@/hooks/User";
import { authClient } from "@/lib/authClient";
import { authErrorMessage } from "@/lib/authErrors";
import { pseudoSchema } from "@/lib/pseudo";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import * as yup from "yup";

const validationSchema = yup.object().shape({
  username: pseudoSchema,
});

// Nouveau pseudo, visible des autres joueurs dans les parties et l'historique
const ChangePseudo = () => {
  const { userName, refresh } = useUser();
  const [editing, setEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async ({ username }: { username: string }) => {
    setErrorMessage("");
    const { error } = await authClient.updateUser({ username: username.trim() });
    if (error) {
      setErrorMessage(authErrorMessage(error));
      return;
    }
    refresh();
    setEditing(false);
    setSuccess(true);
  };

  const startEditing = () => {
    setErrorMessage("");
    setSuccess(false);
    setEditing(true);
  };

  return (
    <section className="w-full max-w-xl mt-8 p-4 border border-base-300 rounded-box space-y-2">
      <h2 className="text-lg font-bold">Mon pseudo</h2>
      {success && <p className="text-sm text-success">Pseudo modifié.</p>}
      {editing ? (
        <Formik
          initialValues={{ username: userName ?? "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <FormError message={errorMessage} />
              <Field
                component={CustomField}
                id="username"
                name="username"
                label="Nouveau pseudo"
                autoComplete="nickname"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                  Enregistrer
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                  Annuler
                </button>
              </div>
            </Form>
          )}
        </Formik>
      ) : (
        <div className="flex items-center gap-4">
          <p>{userName}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={startEditing}>
            Changer de pseudo
          </button>
        </div>
      )}
    </section>
  );
};

export default ChangePseudo;
