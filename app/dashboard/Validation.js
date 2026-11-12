"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { field } from "./ui";
import { draft } from "./draft";
import { PendingCard, DoneCard } from "./MessageCard";

export default function Validation() {
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

  function edit(id, value) {
    setEdits({ ...edits, [id]: value });
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
      {pending.map((m) => (
        <PendingCard
          key={m.id}
          m={m}
          p={byId[m.prospect_id]}
          edited={edits[m.id]}
          onEdit={edit}
          onUpdate={update}
          onDiscard={discard}
        />
      ))}

      {done.length > 0 && (
        <>
          <h3>Déjà traités ({done.length})</h3>
          {done.map((m) => (
            <DoneCard key={m.id} m={m} p={byId[m.prospect_id]} onUpdate={update} />
          ))}
        </>
      )}
    </>
  );
}
