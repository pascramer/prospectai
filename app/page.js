"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || "").trim());

function toFrench(m) {
  const t = (m || "").toLowerCase();
  if (t.includes("invalid login")) return "Email ou mot de passe incorrect.";
  if (t.includes("already registered")) return "Un compte existe déjà avec cet email. Connectez-vous.";
  if (t.includes("at least")) return "Le mot de passe est trop court.";
  if (t.includes("not confirmed")) return "Votre email n’est pas encore confirmé. Cliquez sur le lien reçu par email.";
  if (t.includes("rate limit") || t.includes("too many")) return "Trop de tentatives. Patientez quelques minutes, puis réessayez.";
  if (t.includes("email") && t.includes("invalid")) return "Cette adresse email n’est pas valide.";
  return "Une erreur est survenue. Réessayez.";
}

const TITLES = { login: "Connexion", signup: "Créer mon compte", forgot: "Mot de passe oublié" };

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = window.location.hash + window.location.search;
    if (h.includes("type=recovery")) {
      window.location.href = "/reset" + window.location.hash;
    } else if (h.includes("type=signup")) {
      setConfirmed(true);
    } else if (h.includes("otp_expired")) {
      setError("Ce lien a expiré ou a déjà été utilisé. Connectez-vous, ou demandez un nouveau lien.");
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) router.replace("/dashboard");
      });
    }
  }, [router]);

  function go(m) {
    setMode(m);
    setError("");
    setInfo("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    const mail = email.trim();
    if (!validEmail(mail)) {
      return setError("Cette adresse email n’est pas valide. Vérifiez le « @ » et la fin (exemple : nom@exemple.fr).");
    }
    if (mode === "signup" && password.length < 8) {
      return setError("Le mot de passe doit contenir au moins 8 caractères.");
    }
    if (mode === "login" && !password) return setError("Saisissez votre mot de passe.");
    setBusy(true);
    const origin = window.location.origin;
    if (mode === "forgot") {
      await supabase.auth.resetPasswordForEmail(mail, { redirectTo: origin + "/reset" });
      setInfo("Si un compte existe avec cette adresse, un email vient d’être envoyé avec un lien pour choisir un nouveau mot de passe. Pensez à vérifier vos courriers indésirables.");
    } else if (mode === "signup") {
      const r = await supabase.auth.signUp({ email: mail, password, options: { emailRedirectTo: origin } });
      if (r.error) setError(toFrench(r.error.message));
      else if (r.data.session) router.push("/dashboard");
      else setInfo("Un email de confirmation vient d’être envoyé à " + mail + ". Cliquez sur le lien qu’il contient pour activer votre compte.");
    } else {
      const r = await supabase.auth.signInWithPassword({ email: mail, password });
      if (r.error) setError(toFrench(r.error.message));
      else router.push("/dashboard");
    }
    setBusy(false);
  }

  if (confirmed) {
    return (
      <div className="auth">
        <h1>ProspectAI</h1>
        <h2>✓ Adresse email confirmée</h2>
        <p style={{ color: "var(--mu)" }}>Votre compte est activé. Vous pouvez maintenant accéder à votre espace.</p>
        <button type="button" onClick={() => router.push("/dashboard")}>Accéder à mon espace</button>
      </div>
    );
  }

  return (
    <div className="auth">
      <h1>ProspectAI</h1>
      <h2 style={{ marginTop: 0 }}>{TITLES[mode]}</h2>
      {mode === "forgot" && (
        <p style={{ color: "var(--mu)" }}>
          Saisissez l’adresse email de votre compte. Nous vous enverrons un lien pour choisir un nouveau mot de passe.
        </p>
      )}
      <form onSubmit={submit} noValidate>
        <label>Adresse email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.fr" autoComplete="email" />
        {mode !== "forgot" && (
          <>
            <label>Mot de passe</label>
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "8 caractères minimum" : ""}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--mu)" }}>
              <input type="checkbox" style={{ width: "auto" }} checked={show} onChange={(e) => setShow(e.target.checked)} />
              Afficher le mot de passe
            </label>
          </>
        )}
        {error && <div className="err">{error}</div>}
        {info && <p style={{ color: "#2e7d32" }}>{info}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "Un instant..." : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
        </button>
      </form>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
        {mode === "login" && (
          <button type="button" className="link" onClick={() => go("forgot")}>Mot de passe oublié ?</button>
        )}
        {mode === "login" ? (
          <button type="button" className="link" onClick={() => go("signup")}>Pas encore de compte ? Créer un compte</button>
        ) : (
          <button type="button" className="link" onClick={() => go("login")}>← Retour à la connexion</button>
        )}
      </div>
    </div>
  );
}
