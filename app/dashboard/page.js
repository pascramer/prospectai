"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Overview from "./Overview";
import Campaigns from "./Campaigns";
import Prospects from "./Prospects";
import Validation from "./Validation";
import Replies from "./Replies";

const PAGES = [
  ["Tableau de bord", "Votre activité en un coup d’œil, et ce qu’il vous reste à faire."],
  ["Campagnes", "Une campagne regroupe le type d’entreprises que vous voulez contacter, par exemple celles qui recrutent un profil marketing."],
  ["Prospects", "Les entreprises à contacter. Pour chacune, notez pourquoi la contacter (le signal) : le message s’appuie dessus."],
  ["File de validation", "Le site prépare un email pour chaque prospect. Relisez-le, modifiez-le, puis approuvez-le ou rejetez-le."],
  ["Réponses", "Quand un prospect vous répond, collez sa réponse ici pour la classer et préparer votre réponse."],
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
        <h1 style={{ marginBottom: 4 }}>{PAGES[current][0]}</h1>
        <p style={{ margin: "0 0 22px", color: "var(--mu)", maxWidth: 640 }}>{PAGES[current][1]}</p>
        {current === 0 ? (
          <Overview onGo={setCurrent} />
        ) : current === 1 ? (
          <Campaigns />
        ) : current === 2 ? (
          <Prospects />
        ) : current === 3 ? (
          <Validation />
        ) : (
          <Replies />
        )}
      </main>
    </div>
  );
}
