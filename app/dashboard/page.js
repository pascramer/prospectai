"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const PAGES = [
  ["Tableau de bord", ""],
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

function Overview({ onGo }) {
  const [campaigns, setCampaigns] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const c = await supabase.from("campaigns").select("id,name,status");
      const p = await supabase.from("prospects").select("id,campaign_id,status,signal");
      const m = await supabase.from("messages").select("id,prospect_id,status");
      if (c.error || p.error || m.error) setError("Impossible de charger les chiffres.");
      else {
        setCampaigns(c.data);
        setProspects(p.data);
        setMessages(m.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="empty">Chargement...</div>;
  if (error) return <p className="err">{error}</p>;

  if (campaigns.length === 0)
    return (
      <div className="card empty">
        Bienvenue ! Commencez par créer une campagne (menu « Campagnes »), puis ajoutez des prospects.
        <p>
          <button onClick={() => onGo(1)}>Créer ma première campagne</button>
        </p>
      </div>
    );

  const count = (list, key, value) => list.filter((x) => x[key] === value).length;
  const active = count(campaigns, "status", "active");
  const toValidate = count(messages, "status", "à valider");
  const approved = count(messages, "status", "approuvé");
  const rejected = count(messages, "status", "rejeté");
  const withMessage = new Set(messages.map((m) => m.prospect_id));
  const noMessage = prospects.filter((p) => !withMessage.has(p.id));
  const noSignal = prospects.filter((p) => !p.signal || !p.signal.trim()).length;
  const replied = count(prospects, "status", "a répondu");

  const cards = [
    ["Campagnes actives", active + " / " + campaigns.length],
    ["Prospects", prospects.length],
    ["Messages à valider", toValidate],
    ["Messages approuvés", approved],
    ["Réponses reçues", replied],
  ];

  const funnel = P_STATUTS.map((s) => [s, count(prospects, "status", s)]);
  const max = Math.max(1, ...funnel.map((f) => f[1]));

  const rows = campaigns.map((c) => {
    const ps = prospects.filter((p) => p.campaign_id === c.id);
    const ids = new Set(ps.map((p) => p.id));
    const ms = messages.filter((m) => ids.has(m.prospect_id));
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      prospects: ps.length,
      approved: count(ms, "status", "approuvé"),
      replied: count(ps, "status", "a répondu"),
    };
  });

  const todo = [];
  if (toValidate > 0) todo.push([toValidate + " message(s) attendent votre validation", "Aller à la file de validation", 3]);
  if (noMessage.length > 0) todo.push([noMessage.length + " prospect(s) n’ont pas encore de message", "Préparer les messages", 3]);
  if (noSignal > 0) todo.push([noSignal + " prospect(s) n’ont aucun signal détecté", "Compléter les prospects", 2]);
  if (prospects.length === 0) todo.push(["Vous n’avez pas encore de prospect", "Ajouter un prospect", 2]);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        {cards.map(([label, value]) => (
          <div key={label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
            <div style={{ color: "var(--mu)", fontSize: 13 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>À faire maintenant</h3>
        {todo.length === 0 && <p style={{ margin: 0, color: "var(--mu)" }}>Tout est à jour. Ajoutez de nouveaux prospects pour continuer.</p>}
        {todo.map(([text, label, page]) => (
          <div
            key={text}
            style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--bd)" }}
          >
            <span>{text}</span>
            <button onClick={() => onGo(page)}>{label}</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Avancement des prospects</h3>
        {funnel.map(([label, value]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0", fontSize: 14 }}>
            <span style={{ width: 100, color: "var(--mu)" }}>{label}</span>
            <div style={{ height: 10, borderRadius: 3, background: "var(--ac)", width: Math.max(2, Math.round((value / max) * 60)) + "%" }} />
            <span>{value}</span>
          </div>
        ))}
        <p style={{ margin: "10px 0 0", color: "var(--mu)", fontSize: 13 }}>
          Les statuts « contacté » et « a répondu » se changent à la main dans la page Prospects pour l’instant. Messages rejetés : {rejected}.
        </p>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <h3 style={{ marginTop: 0 }}>Par campagne</h3>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--mu)" }}>
              <th style={{ padding: 8 }}>Campagne</th>
              <th style={{ padding: 8 }}>Statut</th>
              <th style={{ padding: 8 }}>Prospects</th>
              <th style={{ padding: 8 }}>Messages approuvés</th>
              <th style={{ padding: 8 }}>Réponses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--bd)" }}>
                <td style={{ padding: 8 }}><b>{r.name}</b></td>
                <td style={{ padding: 8 }}>{r.status}</td>
                <td style={{ padding: 8 }}>{r.prospects}</td>
                <td style={{ padding: 8 }}>{r.approved}</td>
                <td style={{ padding: 8 }}>{r.replied}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

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
        <label>Votre signature (utilisée dans les
