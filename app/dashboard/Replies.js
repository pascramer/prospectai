"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { field } from "./ui";
import { CATEGORIES, classify, applyCategory } from "./classify";
import ReplyCard from "./ReplyCard";

export default function Replies() {
  const [prospects, setProspects] = useState([]);
  const [replies, setReplies] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prospectId, setProspectId] = useState("");
  const [body, setBody] = useState("");
  const [signature, setSignature] = useState("");

  async function load() {
    const p = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    const r = await supabase.from("replies").select("*").order("created_at", { ascending: false });
    const s = await supabase.from("suppressions").select("*").order("created_at", { ascending: false });
    if (p.error || r.error || s.error) setError("Impossible de charger les réponses.");
    else {
      setProspects(p.data);
      setReplies(r.data);
      setBlocked(s.data);
      if (!prospectId && p.data.length) setProspectId(p.data[0].id);
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

  const sig = signature.trim() || "[Votre prénom] – [Votre agence]";
  const byId = Object.fromEntries(prospects.map((p) => [p.id, p]));

  async function add(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const category = classify(body);
    const { error } = await supabase
      .from("replies")
      .insert({ prospect_id: prospectId, body: body.trim(), category });
    if (error) {
      setBusy(false);
      return setError("La réponse n’a pas pu être enregistrée. Réessayez.");
    }
    await applyCategory(byId[prospectId], category);
    setBusy(false);
    setBody("");
    load();
  }

  async function changeCategory(r, category) {
    setError("");
    const { error } = await supabase.from("replies").update({ category }).eq("id", r.id);
    if (error) return setError("Le classement n’a pas pu être modifié.");
    await applyCategory(byId[r.prospect_id], category);
    load();
  }

  async function removeReply(r) {
    if (!confirm("Supprimer cette réponse ?")) return;
    const { error } = await supabase.from("replies").delete().eq("id", r.id);
    if (error) setError("La réponse n’a pas pu être supprimée.");
    load();
  }

  async function unblock(s) {
    if (!confirm("Retirer cette adresse de la liste d’opposition ? Ne le faites que si la personne vous y autorise.")) return;
    const { error } = await supabase.from("suppressions").delete().eq("id", s.id);
    if (error) setError("L’adresse n’a pas pu être retirée.");
    load();
  }

  if (loading) return <div className="empty">Chargement...</div>;

  if (prospects.length === 0)
    return (
      <div className="card empty">
        Ajoutez d’abord des prospects (menu « Prospects »), puis revenez enregistrer leurs réponses.
      </div>
    );

  return (
    <>
      <form onSubmit={add} className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Enregistrer une réponse reçue</h3>
        <label>Prospect</label>
        <select style={field} value={prospectId} onChange={(e) => setProspectId(e.target.value)}>
          {prospects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.company}
              {p.contact_name ? " – " + p.contact_name : ""}
            </option>
          ))}
        </select>
        <label>Texte de la réponse (copiez-le depuis votre boîte mail)</label>
        <textarea
          style={field}
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ex. : Bonjour, oui volontiers, appelez-moi jeudi."
          required
        />
        <button disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer et classer"}</button>
        <p style={{ margin: "10px 0 0", color: "var(--mu)", fontSize: 13 }}>
          Le classement se fait avec des mots-clés : vérifiez-le, et corrigez-le si besoin dans la liste.
        </p>
      </form>

      {error && <p className="err">{error}</p>}

      <h3>Réponses reçues ({replies.length})</h3>
      {replies.length === 0 && (
        <div className="card empty" style={{ marginBottom: 20 }}>
          Aucune réponse pour l’instant.
        </div>
      )}
      {replies.map((r) => (
        <ReplyCard
          key={r.id}
          r={r}
          p={byId[r.prospect_id]}
          signature={sig}
          onCategory={changeCategory}
          onDelete={removeReply}
        />
      ))}

      <h3 style={{ marginTop: 28 }}>Liste d’opposition ({blocked.length})</h3>
      <div className="card">
        <p style={{ marginTop: 0, color: "var(--mu)", fontSize: 14 }}>
          Ces adresses ont demandé à ne plus être contactées. Ne leur envoyez plus aucun message.
        </p>
        {blocked.length === 0 && <p style={{ margin: 0 }}>Aucune adresse pour l’instant.</p>}
        {blocked.map((s) => (
          <div
            key={s.id}
            style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderTop: "1px solid var(--bd)" }}
          >
            <span>{s.email}</span>
            <button type="button" className="link" onClick={() => unblock(s)}>
              Retirer
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
