"use client";
import { field } from "./ui";

export function PendingCard({ m, p, edited, onEdit, onUpdate, onDiscard }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
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
        value={edited !== undefined ? edited : m.body}
        onChange={(e) => onEdit(m.id, e.target.value)}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => onUpdate(m, "approuvé")}>Approuver</button>
        <button onClick={() => onUpdate(m, "rejeté")}>Rejeter</button>
        {edited !== undefined && (
          <button onClick={() => onUpdate(m, "à valider")}>Enregistrer mes modifications</button>
        )}
        <button type="button" className="link" onClick={() => onDiscard(m)}>
          Supprimer et régénérer
        </button>
      </div>
    </div>
  );
}

export function DoneCard({ m, p, onUpdate }) {
  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <b>{p ? p.company : "Prospect supprimé"}</b>
        <span style={{ color: m.status === "approuvé" ? "var(--ac)" : "var(--mu)" }}>{m.status}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <button type="button" className="link" onClick={() => onUpdate(m, "à valider")}>
          Remettre à valider
        </button>
      </div>
    </div>
  );
}
