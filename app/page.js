"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const arrivedFrom =
  typeof window !== "undefined" ? window.location.hash + window.location.search : "";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (/error/i.test(arrivedFrom)) {
      setError("Le lien de confirmation est invalide ou a expiré. Créez à nouveau votre compte.");
    } else if (/type=signup|access_token|code=/.test(arrivedFrom)) {
      setNotice("Votre adresse email a bien été confirmée. Vous pouvez maintenant vous connecter.");
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError(""); setInfo(""); setNotice(""); setBusy(true);
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (data.session) router.push("/dashboard");
    else setInfo("Compte créé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation, puis revenez vous connecter.");
  }

  return (
    <div className="auth">
      <h1>ProspectAI</h1>
      <p style={{ color: "var(--mu)" }}>
        {mode === "login" ? "Connectez-vous à votre espace." : "Créez votre compte."}
      </p>
      {notice && <p style={{ color: "var(--ac)", fontWeight: 600 }}>{notice}</p>}
      <form onSubmit={submit} className="card">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Mot de passe (6 caractères minimum)</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        {error && <p className="err">{error}</p>}
        {info && <p>{info}</p>}
        <button disabled={busy}>{busy ? "Patientez..." : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
        <p>
          <button type="button" className="link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Pas de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
          </button>
        </p>
      </form>
    </div>
  );
}
