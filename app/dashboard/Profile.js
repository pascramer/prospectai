"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { field } from "./ui";

const EMPTY = {
  business_name: "",
  activity: "",
  city: "",
  offer: "",
  target: "",
  website: "",
  phone: "",
  booking_link: "",
  signature: "",
  extra: "",
};

export default function Profile({ onNext }) {
  const [f, setF] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("business_profile").select("*").maybeSingle();
      if (error) setError("Impossible de charger votre profil.");
      else if (data) {
        const next = { ...EMPTY };
        Object.keys(EMPTY).forEach((k) => {
          next[k] = data[k] || "";
        });
        setF(next);
      }
      setLoading(false);
    }
    load();
  }, []);

  function set(key, value) {
    setSaved(false);
    setF({ ...f, [key]: value });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const row = { updated_at: new Date().toISOString() };
    Object.keys(EMPTY).forEach((k) => {
      row[k] = f[k].trim();
    });
    const { error } = await supabase.from("business_profile").upsert(row, { onConflict: "user_id" });
    setBusy(false);
    if (error) return setError("Le profil n’a pas pu être enregistré. Réessayez.");
    try {
      localStorage.setItem("signature", row.signature);
      const intro = [row.business_name, row.activity].filter(Boolean).join(", ");
      const where = row.city ? " à " + row.city : "";
      localStorage.setItem("agency", (intro + where + ". " + row.offer).trim());
    } catch (e) {}
    setSaved(true);
  }

  if (loading) return <div className="empty">Chargement...</div>;

  return (
    <form onSubmit={save} className="card">
      <h3 style={{ marginTop: 0 }}>Votre activité</h3>
      <label>Nom de votre entreprise</label>
      <input value={f.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Ex. : Auto-école Martin" required />
      <label>Votre métier</label>
      <input value={f.activity} onChange={(e) => set("activity", e.target.value)} placeholder="Ex. : auto-école, agence web, plombier…" required />
      <label>Ville ou zone d’activité</label>
      <input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex. : Lyon et sa périphérie" />
      <label>Ce que vous proposez</label>
      <textarea
        style={field}
        rows={3}
        value={f.offer}
        onChange={(e) => set("offer", e.target.value)}
        placeholder="Ex. : permis de conduire accéléré, conduite accompagnée, formation pour les entreprises"
        required
      />
      <label>Qui vous voulez contacter</label>
      <textarea
        style={field}
        rows={2}
        value={f.target}
        onChange={(e) => set("target", e.target.value)}
        placeholder="Ex. : entreprises qui recrutent des jeunes de 18 à 25 ans, comités d’entreprise"
      />
      <label>Site web</label>
      <input value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="Ex. : www.autoecole-martin.fr" />
      <label>Téléphone</label>
      <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Ex. : 04 00 00 00 00" />
      <label>Lien de prise de rendez-vous</label>
      <input value={f.booking_link} onChange={(e) => set("booking_link", e.target.value)} placeholder="Ex. : https://calendly.com/…" />
      <label>Votre signature (prénom, nom, entreprise)</label>
      <input value={f.signature} onChange={(e) => set("signature", e.target.value)} placeholder="Ex. : Julie Martin – Auto-école Martin" required />
      <label>Autres informations utiles (tarifs, délais, atouts…)</label>
      <textarea
        style={field}
        rows={3}
        value={f.extra}
        onChange={(e) => set("extra", e.target.value)}
        placeholder="Ex. : 98 % de réussite, financement CPF possible, cours le soir et le samedi"
      />
      {error && <p className="err">{error}</p>}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</button>
        {saved && <span style={{ color: "var(--ac)" }}>Enregistré.</span>}
        {saved && onNext && (
          <button type="button" onClick={onNext}>
            Étape suivante : créer une campagne
          </button>
        )}
      </div>
    </form>
  );
}
