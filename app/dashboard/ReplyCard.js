"use client";
import { useState } from "react";
import { field } from "./ui";
import { CATEGORIES, suggestion } from "./classify";

export default function ReplyCard({ r, p, signature, onCategory, onDelete }) {
  const [copied, setCopied] = useState(false);
  const text = p ? suggestion(r.category, p, signature) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <b style={{ fontSize: 17 }}>{p ? p.company : "Prospect supprimé"}</b>
        <span style={{ color: "var(--mu)", fontSize: 13 }}>
          {new Date(r.created_at).toLocaleDateString("fr-FR")}
        </span>
      </div>
      {p && p.contact_name && <p style={{ margin: "4px 0 0", color: "var(--mu)" }}>{p.contact_name}</p>}
      <p style={{ margin: "10px 0", borderLeft: "3px solid var(--bd)", paddingLeft: 10, whiteSpace: "pre-wrap" }}>
        {r.body}
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--mu)" }}>Classement :</span>
        <select
          style={{ ...field, width: "auto", margin: 0, padding: "6px 8px" }}
          value={r.category}
          onChange={(e) => onCategory(r, e.target.value)}
        >
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button type="button" className="link" onClick={() => onDelete(r)}>
          Supprimer
        </button>
      </div>
      {r.category === "desinscription" && (
        <p style={{ margin: "10px 0 0", color: "var(--ac)", fontSize: 14 }}>
          Cette personne a été ajoutée à la liste d’opposition : ne la contactez plus.
        </p>
      )}
      {text && (
        <div style={{ marginTop: 12 }}>
          <b style={{ fontSize: 14 }}>Réponse suggérée</b>
          <textarea style={field} rows={7} defaultValue={text} key={r.category} />
          <button type="button" onClick={copy}>
            {copied ? "Copié !" : "Copier la réponse"}
          </button>
        </div>
      )}
    </div>
  );
}
