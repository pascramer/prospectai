"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { P_STATUTS } from "./ui";

export default function Overview({ onGo }) {
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
