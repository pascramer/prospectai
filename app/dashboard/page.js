"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Profile from "./Profile";
import Campaigns from "./Campaigns";
import Prospects from "./Prospects";
import Validation from "./Validation";
import Replies from "./Replies";
import Overview from "./Overview";

const PAGES = [
  ["Mon activité", "Présentez votre entreprise une seule fois : le site s’en sert pour écrire vos messages."],
  ["Campagnes", "Une campagne regroupe le type d’entreprises que vous voulez contacter."],
  ["Prospects", "Les entreprises à contacter. Pour chacune, notez pourquoi la contacter (le signal) : le message s’appuie dessus."],
  ["File de validation", "Le site prépare un email pour chaque prospect. Relisez-le, modifiez-le, puis approuvez-le ou rejetez-le."],
  ["Réponses", "Quand un prospect vous répond, collez sa réponse ici pour la classer et préparer votre réponse."],
  ["Tableau de bord", "Votre activité en un coup d’œil, et ce qu’il vous reste à faire."],
];

const NEXT = [
  "Étape suivante : créer une campagne",
  "Étape suivante : ajouter des prospects",
  "Étape suivante : préparer les messages",
  "Étape suivante : enregistrer les réponses",
  "Voir mon tableau de bord",
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function start() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace("/");
      setUser(data.session.user);
      const p = await supabase.from("business_profile").select("user_id").maybeSingle();
      if (p.data) setCurrent(5);
      setReady(true);
    }
    start();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [current]);

  function next() {
    setCurrent(current + 1);
  }

  if (!ready) return <div className="empty">Chargement...</div>;

  return (
    <div className="shell">
      <nav className="side">
        <div className="logo">ProspectAI</div>
        {PAGES.map(([label], i) => (
          <a
            key={label}
            href="#"
            className={current === i ? "on" : ""}
            onClick={(e) => {
              e.preventDefault();
              setCurrent(i);
            }}
          >
            {label}
          </a>
        ))}
        <div style={{ marginTop: "auto", padding: 10, fontSize: 12, color: "var(--mu)" }}>
          {user?.email}
          <br />
          <button className="link" onClick={() => supabase.auth.signOut()}>
            Se déconnecter
          </button>
        </div>
      </nav>
      <main className="main">
        <h1 style={{ marginBottom: 4 }}>{PAGES[current][0]}</h1>
        <p style={{ margin: "0 0 16px", color: "var(--mu)", maxWidth: 640 }}>{PAGES[current][1]}</p>
        {current < 5 && (
          <div
            className="card"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 14, marginBottom: 20 }}
          >
            <span style={{ color: "var(--mu)" }}>Étape {current + 1} sur 5</span>
            <button type="button" onClick={next}>
              {NEXT[current]}
            </button>
          </div>
        )}
        {current === 0 ? (
          <Profile />
        ) : current === 1 ? (
          <Campaigns />
        ) : current === 2 ? (
          <Prospects />
        ) : current === 3 ? (
          <Validation />
        ) : current === 4 ? (
          <Replies />
        ) : (
          <Overview onGo={setCurrent} />
        )}
      </main>
    </div>
  );
}
