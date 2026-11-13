"use client";
import { useState } from "react";
import { field } from "./ui";
import { CATEGORIES } from "./classify";
import { buildPrompt } from "./aiPrompt";

export default function ReplyCard({ r, p, signature, agency, firstEmail, onCategory, onDelete }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    if (!p) return;
    const text = buildPrompt({ agency, signature, p, firstEmail, reply: r.body });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      alert("La copie a échoué. Essayez avec un autre navigateur.");
    }
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
      {p && r.category !== "desinscription" && (
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={copyPrompt}>
            {copied ? "Demande copiée !" : "Copier la demande pour l’assistant IA"}          </button>
          <p style={{ margin: "8px 0 0", color: "var(--mu)", fontSize: 13 }}>
            Collez-le dans une nouvelle conversation Claude : vous obtenez 3 réponses adaptées à ce message.
          </p>
        </div>
      )}
    </div>
  );
}
