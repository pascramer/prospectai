"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const PAGES = [
  ["Tableau de bord", "Vos indicateurs apparaîtront ici après votre première campagne."],
  ["Campagnes", ""],
  ["Prospects", ""],
  ["File de validation", ""],
  ["Réponses", "Aucune réponse reçue."],
  ["Paramètres", "Les réglages arriveront dans une prochaine étape."],
  ["Facturation", "La facturation sera ajoutée plus tard."],
];

const TONES = ["professionnel", "chaleureux", "direct"];
const STATUTS = ["brouillon", "active", "en pause"];
const P_STATUTS = ["nouveau", "validé", "contacté", "a répondu", "désinscrit"];

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
    if (!confirm("Supprimer cette campagne et tous ses prospects ? Cette action est définitive.")) return;
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

function Prospects() {
  const [campaigns, setCampaigns] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("toutes");
  const [campaignId, setCampaignId] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [signal, setSignal] = useState("");
  const [source, setSource] = useState("");

  async function load() {
    const c = await supabase.from("campaigns").select("id,name").order("created_at", { ascending: false });
    const p = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    if (c.error || p.error) setError("Impossible de charger les prospects.");
    else {
      setCampaigns(c.data);
      setItems(p.data);
      if (!campaignId && c.data.length) setCampaignId(c.data[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.from("prospects").insert({
      campaign_id: campaignId,
      company: company.trim(),
      contact_name: contact.trim(),
      role: role.trim(),
      email: email.trim(),
      signal: signal.trim(),
      source: source.trim(),
    });
    setBusy(false);
    if (error) return setError("Le prospect n’a pas pu être ajouté. Réessayez.");
    setCompany("");
    setContact("");
    setRole("");
    setEmail("");
    setSignal("");
    setSource("");
    load();
  }

  async function setStatus(id, status) {
    setError("");
    const { error } = await supabase.from("prospects").update({ status }).eq("id", id);
    if (error) setError("Le statut n’a pas pu être modifié.");
    load();
  }

  async function remove(id) {
    if (!confirm("Supprimer ce prospect ? Cette action est définitive.")) return;
    setError("");
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (error) setError("Le prospect n’a pas pu être supprimé.");
    load();
  }

  if (loading) return <div className="empty">Chargement...</div>;

  if (campaigns.length === 0)
    return (
      <div className="card empty">
        Créez d’abord une campagne (menu « Campagnes »), puis revenez ajouter des prospects.
      </div>
    );

  const names = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));
  const shown = filter === "toutes" ? items : items.filter((p) => p.campaign_id === filter);

  return (
    <>
      <form onSubmit={add} className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Nouveau prospect</h3>
        <label>Campagne</label>
        <select style={field} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label>Entreprise</label>
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex. : Atelier Vernet Menuiserie" required />
        <label>Nom du contact</label>
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Ex. : Claire Vernet" />
        <label>Poste</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex. : Gérante" />
        <label>Email professionnel</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex. : claire@atelier-vernet.fr" />
        <label>Signal détecté (pourquoi la contacter)</label>
        <textarea
          style={field}
          rows={2}
          value={signal}
          onChange={(e) => setSignal(e.target.value)}
          placeholder="Ex. : Offre d’emploi publiée il y a 3 jours : chargé de communication"
        />
        <label>Source du signal (lien ou nom du site)</label>
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ex. : francetravail.fr" />
        <button disabled={busy}>{busy ? "Ajout..." : "Ajouter le prospect"}</button>
      </form>

      {error && <p className="err">{error}</p>}

      <div style={{ marginBottom: 12 }}>
        <label>Afficher</label>
        <select style={{ ...field, maxWidth: 360 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="toutes">Toutes les campagnes</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {shown.length === 0 && (
        <div className="card empty">Aucun prospect pour l’instant. Ajoutez le premier ci-dessus.</div>
      )}

      {shown.map((p) => (
        <div key={p.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <b style={{ fontSize: 17 }}>{p.company}</b>
            <span style={{ color: "var(--mu)", fontSize: 13 }}>{names[p.campaign_id]}</span>
          </div>
          {(p.contact_name || p.role) && (
            <p style={{ margin: "6px 0 0" }}>
              {p.contact_name}
              {p.contact_name && p.role ? " · " : ""}
              {p.role}
            </p>
          )}
          {p.email && <p style={{ margin: "2px 0 0", color: "var(--mu)" }}>{p.email}</p>}
          {p.signal && (
            <p style={{ margin: "8px 0", borderLeft: "3px solid var(--ac)", paddingLeft: 10 }}>
              <b>Signal :</b> {p.signal}
              {p.source && <span style={{ color: "var(--mu)" }}> (source : {p.source})</span>}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              style={{ ...field, width: "auto", margin: 0, padding: "6px 8px" }}
              value={p.status}
              onChange={(e) => setStatus(p.id, e.target.value)}
            >
              {P_STATUTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className="link" onClick={() => remove(p.id)}>
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

function draft(p, tone, signature) {
  const first = (p.contact_name || "").trim().split(" ")[0];
  const hello = first ? "Bonjour " + first + "," : "Bonjour,";
  const fact = (p.signal || "").trim().replace(/\.$/, "");
  const lower = fact.charAt(0).toLowerCase() + fact.slice(1);
  let body;
  if (tone === "chaleureux") {
    body =
      hello + "\n\nEn découvrant " + p.company + ", j’ai vu que " + lower +
      ". Cela m’a donné quelques idées que j’aimerais partager avec vous.\n\n" +
      "Si vous le souhaitez, nous pouvons en parler 15 minutes cette semaine, sans engagement. Cela vous dirait ?\n\n" +
      "Bien à vous,\n" + signature;
  } else if (tone === "direct") {
    body =
      hello + "\n\n" + p.company + " : " + lower + ".\n\n" +
      "Nous aidons les entreprises dans cette situation. Un appel de 15 minutes cette semaine ?\n\n" + signature;
  } else {
    body =
      hello + "\n\nJ’ai remarqué ceci chez " + p.company + " : " + lower + ".\n\n" +
      "Nous accompagnons des entreprises dans cette situation. Seriez-vous disponible pour un échange de 15 minutes cette semaine afin d’en discuter ?\n\n" +
      "Cordialement,\n" + signature;
  }
  return (
    body +
    "\n\n—\nVos coordonnées proviennent de sources publiques" +
    (p.source ? " (" + p.source + ")" : "") +
    ". Pour ne plus être contacté, répondez « stop »."
  );
}

function Validation() {
  const [campaigns, setCampaigns] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState({});
  const [signature, setSignature] = useState("");

  async function load() {
    const c = await supabase.from("campaigns").select("id,name,tone");
    const p = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    const m = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (c.error || p.error || m.error) setError("Impossible de charger les messages.");
    else {
      setCampaigns(c.data);
      setProspects(p.data);
      setMessages(m.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    try {
      const s = localStorage.getItem("signature");
      if (s) setSignature(s);
    } catch (e) {}
    load();
  }, []);

  function changeSignature(v) {
    setSignature(v);
    try {
      localStorage.setItem("signature", v);
    } catch (e) {}
  }

  const sig = signature.trim() || "[Votre prénom] – [Votre agence]";
  const tones = Object.fromEntries(campaigns.map((c) => [c.id, c.tone]));
  const byId = Object.fromEntries(prospects.map((p) => [p.id, p]));
  const hasMessage = new Set(messages.map((m) => m.prospect_id));
  const todo = prospects.filter((p) => !hasMessage.has(p.id));
  const ready = todo.filter((p) => p.signal && p.signal.trim());
  const pending = messages.filter((m) => m.status === "à valider");
  const done = messages.filter((m) => m.status !== "à valider");

  async function create(list) {
    setError("");
    setBusy(true);
    const rows = list.map((p) => ({
      prospect_id: p.id,
      body: draft(p, tones[p.campaign_id] || "professionnel", sig),
    }));
    const { error } = await supabase.from("messages").insert(rows);
    setBusy(false);
    if (error) setError("Les messages n’ont pas pu être préparés. Réessayez.");
    load();
  }

  async function update(m, status) {
    setError("");
    const body = edits[m.id] !== undefined ? edits[m.id] : m.body;
    const { error } = await supabase.from("messages").update({ body, status }).eq("id", m.id);
    if (error) return setError("Le message n’a pas pu être modifié.");
    if (status === "approuvé") {
      await supabase.from("prospects").update({ status: "validé" }).eq("id", m.prospect_id);
    }
    setEdits((e) => {
      const copy = { ...e };
      delete copy[m.id];
      return copy;
    });
    load();
  }

  async function discard(m) {
    if (!confirm("Supprimer ce message ? Vous pourrez en générer un nouveau.")) return;
    setError("");
    const { error } = await supabase.from("messages").delete().eq("id", m.id);
    if (error) setError("Le message n’a pas pu être supprimé.");
    load();
  }

  if (loading) return <div className="empty">Chargement...</div>;

  if (prospects.length === 0)
    return (
      <div className="card empty">
        Ajoutez d’abord des prospects (menu « Prospects ») : chacun doit avoir un signal détecté.
      </div>
    );

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <label>Votre signature (utilisée dans les messages)</label>
        <input
          value={signature}
          onChange={(e) => changeSignature(e.target.value)}
          placeholder="Ex. : Sophie Martin – Agence Pixelia"
        />
        <p style={{ margin: 0, color: "var(--mu)", fontSize: 13 }}>
          Elle est enregistrée sur cet appareil. Modifiez-la avant de préparer les messages.
        </p>
      </div>

      {error && <p className="err">{error}</p>}

      {todo.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Prospects sans message ({todo.length})</h3>
          {ready.length > 1 && (
            <p>
              <button disabled={busy} onClick={() => create(ready)}>
                {busy ? "Préparation..." : "Préparer les " + ready.length + " messages"}
              </button>
            </p>
          )}
          {todo.map((p) => (
            <div
              key={p.id}
              style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "8px 0", borderTop: "1px solid var(--bd)" }}
            >
              <span>
                <b>{p.company}</b>
                {!p.signal && (
                  <span className="err"> — aucun signal : ajoutez-en un dans « Prospects » avant de préparer un message</span>
                )}
              </span>
              {p.signal && (
                <button disabled={busy} onClick={() => create([p])}>
                  Préparer le message
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h3>À valider ({pending.length})</h3>
      {pending.length === 0 && (
        <div className="card empty" style={{ marginBottom: 20 }}>
          Aucun message à valider pour l’instant.
        </div>
      )}
      {pending.map((m) => {
        const p = byId[m.prospect_id];
        return (
          <div key={m.id} className="card" style={{ marginBottom: 14 }}>
            <b style={{ fontSize: 17 }}>{p ? p.company : "Prospect supprimé"}</b>
            {p && p.contact_name && <span style={{ color: "var(--mu)" }}> · {p.contact_name}</span>}
            {p && p.signal && (
              <p style={{ margin: "8px 0", borderLeft: "3px solid var(--ac)", paddingLeft: 10 }}>
                <b>Fait cité :</b> {p.signal}
                {p.source && <span style={{ color: "var(--mu)" }}> (source : {p.source})</span>}
              </p>
            )}
            <textarea
              style={field}
              rows={12}
              value={edits[m.id] !== undefined ? edits[m.id] : m.body}
              onChange={(e) => setEdits({ ...edits, [m.id]: e.target.value })}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={() => update(m, "approuvé")}>Approuver</button>
              <button onClick={() => update(m, "rejeté")}>Rejeter</button>
              {edits[m.id] !== undefined && (
                <button onClick={() => update(m, "à valider")}>Enregistrer mes modifications</button>
              )}
              <button type="button" className="link" onClick={() => discard(m)}>
                Supprimer et régénérer
              </button>
            </div>
          </div>
        );
      })}

      {done.length > 0 && (
        <>
          <h3>Déjà traités ({done.length})</h3>
          {done.map((m) => {
            const p = byId[m.prospect_id];
            return (
              <div key={m.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <b>{p ? p.company : "Prospect supprimé"}</b>
                  <span style={{ color: m.status === "approuvé" ? "var(--ac)" : "var(--mu)" }}>{m.status}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <button type="button" className="link" onClick={() => update(m, "à valider")}>
                    Remettre à valider
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
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
        ) : current === 2 ? (
          <Prospects />
        ) : current === 3 ? (
          <Validation />
        ) : (
          <div className="card empty">{PAGES[current][1]}</div>
        )}
      </main>
    </div>
  );
}
