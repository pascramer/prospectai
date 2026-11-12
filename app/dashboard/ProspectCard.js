"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { P_STATUTS, field } from "./ui";

export default function ProspectCard({ p, campaignName, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    company: p.company,
    contact_name: p.contact_name || "",
    role: p.role || "",
    email: p.email || "",
    signal: p.signal || "",
    source: p.source || "",
  });

  function set(key, value) {
    setF({ ...f, [key]: value });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase
      .from("prospects")
      .update({
        company: f.company.trim(),
        contact_name: f.contact_name.trim(),
        role: f.role.trim(),
        email: f.email.trim(),
        signal: f.signal.trim(),
        source: f.source.trim(),
      })
      .eq("id", p.id);
    setBusy(false);
    if (error) return setError("Les modifications n’ont pas pu être enregistrées.");
    setEditing(false);
    onChanged();
  }

  async function setStatus(status) {
    setError("");
    const { error } = await supabase.from("prospects").update({ status }).eq("id", p.id);
    if (error) setError("Le statut n’a pas pu être modifié.");
    onChanged();
  }

  async function remove() {
    if (!confirm("Supprimer ce prospect ? Cette action est définitive.")) return;
    setError("");
    const { error } = await supabase.from("prospects").delete().eq("id", p.id);
    if (error) setError("Le prospect n’a pas pu être supprimé.");
    onChanged();
  }

  if (editing)
    return (
      <form onSubmit={save} className="card" style={{ marginBottom: 12 }}>
        <label>Entreprise</label>
        <input value={f.company} onChange={(e) => set("company", e.target.value)} required />
        <label>Nom du contact</label>
        <input value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
        <label>Poste</label>
        <input value={f.role} onChange={(e) => set("role", e.target.value)} />
        <label>Email professionnel</label>
        <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        <label>Signal détecté</label>
        <textarea style={field} rows={2} value={f.signal} onChange={(e) => set("signal", e.target.value)} />
        <label>Source du signal</label>
        <input value={f.source} onChange={(e) => set("source", e.target.value)} />
        {error && <p className="err">{error}</p>}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</button>
          <button type="button" className="link" onClick={() => setEditing(false)}>
            Annuler
          </button>
        </div>
        <p style={{ margin: "10px 0 0", color: "var(--mu)", fontSize: 13 }}>
          Un message déjà préparé garde l’ancien texte : supprimez-le dans la file de validation pour en générer un nouveau.
        </p>
      </form>
    );

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <b style={{ fontSize: 17 }}>{p.company}</b>
        <span style={{ color: "var(--mu)", fontSize: 13 }}>{campaignName}</span>
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
      {error && <p className="err">{error}</p>}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select
          style={{ ...field, width: "auto", margin: 0, padding: "6px 8px" }}
          value={p.status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {P_STATUTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="button" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button type="button" className="link" onClick={remove}>
          Supprimer
        </button>
      </div>
    </div>
  );
}
