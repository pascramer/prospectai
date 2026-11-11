"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const PAGES = [
  ["Tableau de bord", "Vos indicateurs apparaîtront ici après votre première campagne."],
  ["Campagnes", ""],
  ["Prospects", "Aucun prospect pour l’instant."],
  ["File de validation", "Aucun message à valider."],
  ["Réponses", "Aucune réponse reçue."],
  ["Paramètres", "Les réglages arriveront dans une prochaine étape."],
  ["Facturation", "La facturation sera ajoutée plus tard."],
];

const TONES = ["professionnel", "chaleureux", "direct"];
const STATUTS = ["brouillon", "active", "en pause"];

const field = {
  width: "100%",
  padding: 10,
  margin: "6px 0 12px",
  border: "1px solid var(--bd)",
  borderRadius: 6,
  background: "var(--bg)",
  color: "var(--tx)",
  fontSize: 15,
  fontFamily: "inherit",
};

function Campaigns() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [tone, setTone] = useState("professionnel");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError("Impossible de charger les campagnes.");
    else setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase
      .from("campaigns")
      .insert({ name: name.trim(), target: target.trim(), tone });
    setBusy(false);
    if (error) return setError("La campagne n’a pas pu être créée. Réessayez.");
    setName("");
    setTarget("");
    setTone("professionnel");
    load();
  }

  async function setStatus(id, status) {
    setError("");
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
    if (error) setError("Le statut n’a pas pu être modifié.");
    load();
  }

  async function remove(id) {
    if (!confirm("Supprimer cette campagne ? Cette action est définitive.")) return;
    setError("");
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) setError("La campagne n’a pas pu être supprimée.");
    load();
  }

  return (
    <>
      <form onSubmit={add} className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Nouvelle campagne</h3>
        <label>Nom de la campagne</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : PME qui recrutent un profil marketing" required />
        <label>Cible (client idéal)</label>
        <textarea
          style={field}
          rows={3}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Ex. : entreprises de 10 à 50 salariés à Lyon qui viennent de publier une offre en communication"
        />
        <label>Ton des messages</label>
        <select style={field} value={tone} onChange={(e) => setTone(e.target.value)}>
          {TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button disabled={busy}>{busy ? "Création..." : "Créer la campagne"}</button>
      </form>

      {error && <p className="err">{error}</p>}
      {loading && <div className="empty">Chargement...</div>}
      {!loading && items.length === 0 && (
        <div className="card empty">Aucune campagne pour l’instant. Créez la première ci-dessus.</div>
      )}

      {items.map((c) => (
        <div key={c.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <b style={{ fontSize: 17 }}>{c.name}</b>
            <span style={{ color: "var(--mu)", fontSize: 13 }}>ton {c.tone}</span>
          </div>
          {c.target && <p style={{ margin: "8px 0", color: "var(--mu)" }}>{c.target}</p>}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              style={{ ...field, width: "auto", margin: 0, padding: "6px 8px" }}
              value={c.status}
              onChange={(e) => setStatus(c.id, e.target.value)}
            >
              {STATUTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className="link" onClick={() => remove(c.id)}>
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

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
        {current === 1 ? (
          <Campaigns />
        ) : (
          <div className="card empty">{PAGES[current][1]}</div>
        )}
      </main>
    </div>
  );
}
