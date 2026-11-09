"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const LINKS = [
  ["/dashboard", "Tableau de bord"],
  ["/campagnes", "Campagnes"],
  ["/prospects", "Prospects"],
  ["/validation", "File de validation"],
  ["/reponses", "Réponses"],
  ["/parametres", "Paramètres"],
  ["/facturation", "Facturation"],
];

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/");
      else { setUser(data.session.user); setReady(true); }
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
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={pathname === href ? "on" : ""}>{label}</Link>
        ))}
        <div style={{ marginTop: "auto", padding: 10, fontSize: 12, color: "var(--mu)" }}>
          {user?.email}
          <br />
          <button className="link" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
        </div>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
