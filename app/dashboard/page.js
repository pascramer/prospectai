"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const PAGES = [
  ["Tableau de bord", "Vos indicateurs apparaîtront ici après votre première campagne."],
  ["Campagnes", "Aucune campagne pour l’instant."],
  ["Prospects", "Aucun prospect pour l’instant."],
  ["File de validation", "Aucun message à valider."],
  ["Réponses", "Aucune réponse reçue."],
  ["Paramètres", "Les réglages arriveront dans une prochaine étape."],
  ["Facturation", "La facturation sera ajoutée plus tard."],
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/");
      else {
        setUser(data.session.user);
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

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
        <h1>{PAGES[current][0]}</h1>
        <div className="card empty">{PAGES[current][1]}</div>
      </main>
    </div>
  );
}
