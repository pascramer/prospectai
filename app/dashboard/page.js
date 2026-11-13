"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Profile from "./Profile";
import { remember } from "./ProfileForm";
import Campaigns from "./Campaigns";
import Prospects from "./Prospects";
import Validation from "./Validation";
import Replies from "./Replies";
import Overview from "./Overview";
import { StepsBar, StepFooter, firstTodo } from "./Guide";

const PAGES = [
  ["Mon activité", "Votre profil professionnel : le site s’en sert pour écrire vos messages."],
  ["Campagnes", "Une campagne regroupe le type d’entreprises que vous voulez contacter."],
  ["Prospects", "Les entreprises à contacter. Pour chacune, notez pourquoi la contacter (le signal) : le message s’appuie dessus."],
  ["File de validation", "Le site prépare un email pour chaque prospect. Relisez-le, modifiez-le, puis approuvez-le ou rejetez-le."],
  ["Réponses", "Quand un prospect vous répond, collez sa réponse ici pour la classer et préparer votre réponse."],
  ["Tableau de bord", "Votre activité en un coup d’œil, et ce qu’il vous reste à faire."],
];

const LABELS = PAGES.slice(0, 5).map((p) => p[0]);

const NEXT = [
  "Étape suivante : créer une campagne",
  "Étape suivante : ajouter des prospects",
  "Étape suivante : préparer les messages",
  "Étape suivante : enregistrer les réponses",
  "Terminer et voir mon tableau de bord",
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(5);
  const [guided, setGuided] = useState(false);

  function finish() {
    setGuided(false);
    setCurrent(5);
    supabase.auth.updateUser({ data: { onboarded: true } });
  }

  useEffect(() => {
    async function start() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace("/");
      const u = data.session.user;
      setUser(u);
      const p = await supabase.from("business_profile").select("*").maybeSingle();
      if (p.data) remember(p.data);
      if (u.user_metadata && u.user_metadata.onboarded) {
        setCurrent(5);
      } else {
        const t = await firstTodo();
        if (t === -1) {
          supabase.auth.updateUser({ data: { onboarded: true } });
          setCurrent(5);
        } else {
          setGuided(true);
          setCurrent(t);
        }
      }
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

  if (!ready) return <div className="empty">Chargement...</div>;

  const showGuide = guided && current < 5;

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
        {showGuide && <StepsBar current={current} labels={LABELS} />}
        <h1 style={{ marginBottom: 4 }}>{PAGES[current][0]}</h1>
        <p style={{ margin: "0 0 20px", color: "var(--mu)", maxWidth: 640 }}>{PAGES[current][1]}</p>
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
        {showGuide && (
          <StepFooter
            key={current}
            step={current}
            nextLabel={NEXT[current]}
            onNext={current === 4 ? finish : () => setCurrent(current + 1)}
          />
        )}
      </main>
    </div>
  );
}
