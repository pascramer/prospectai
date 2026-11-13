"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { field } from "./ui";
import CityInput, { isCityValid } from "./CityInput";
import { validPhone, formatPhone, validUrl, fixUrl } from "../../lib/validate";

export const EMPTY = {
  business_name: "", activity: "", city: "", offer: "", target: "",
  website: "", phone: "", booking_link: "", signature: "", extra: "",
};

export function remember(p) {
  try {
    const c = {};
    Object.keys(EMPTY).forEach((k) => (c[k] = (p && p[k]) || ""));
    localStorage.setItem("profile", JSON.stringify(c));
    localStorage.setItem("signature", c.signature);
    const intro = [c.business_name, c.activity].filter(Boolean).join(", ");
    const where = c.city ? " à " + c.city : "";
    localStorage.setItem("agency", (intro + where + ". " + c.offer).trim());
  } catch (e) {}
}

function check(f) {
  const e = {};
  if (!f.business_name.trim()) e.business_name = "Indiquez le nom de votre entreprise.";
  if (!f.activity.trim()) e.activity = "Indiquez votre métier ou votre activité.";
  if (!isCityValid(f.city)) {
    e.city = f.city.trim()
      ? "Cette ville n’est pas reconnue : choisissez-la dans la liste qui s’affiche."
      : "Indiquez votre ville.";
  }
  if (!f.offer.trim()) e.offer = "Décrivez en une ou deux phrases ce que vous proposez.";
  if (f.phone.trim() && !validPhone(f.phone)) e.phone = "Ce numéro n’est pas valide. Exemple : 06 12 34 56 78.";
  ["website", "booking_link"].forEach((k) => {
    if (f[k].trim() && !validUrl(f[k])) e[k] = "Ce lien n’est pas valide. Exemple : www.monsite.fr";
  });
  if (!f.signature.trim()) e.signature = "Indiquez la signature de vos messages.";
  return e;
}

function Row({ label, hint, error, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>{label}</label>
      {hint && <div style={{ fontSize: 13, color: "var(--mu)", marginBottom: 6 }}>{hint}</div>}
      {children}
      {error && <div className="err" style={{ marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export default function ProfileForm({ data, onSaved, onCancel }) {
  const [f, setF] = useState(data || EMPTY);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setErrors({ ...errors, [k]: "" });
  };
  const inp = (k) => ({ ...field, borderColor: errors[k] ? "#c0392b" : undefined });

  async function save(ev) {
    ev.preventDefault();
    setMsg("");
    const e = check(f);
    setErrors(e);
    if (Object.keys(e).length) {
      setMsg("Corrigez les champs en rouge, puis réessayez.");
      return;
    }
    const clean = {};
    Object.keys(EMPTY).forEach((k) => (clean[k] = f[k].trim()));
    if (clean.phone) clean.phone = formatPhone(clean.phone);
    if (clean.website) clean.website = fixUrl(clean.website);
    if (clean.booking_link) clean.booking_link = fixUrl(clean.booking_link);
    setBusy(true);
    const r = await supabase
      .from("business_profile")
      .upsert({ ...clean, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setBusy(false);
    if (r.error) {
      setMsg("Enregistrement impossible : " + r.error.message);
      return;
    }
    remember(clean);
    onSaved(clean);
  }

  return (
    <form className="card" style={{ maxWidth: 680 }} onSubmit={save} noValidate>
      <Row label="Nom de l’entreprise *" error={errors.business_name}>
        <input style={inp("business_name")} value={f.business_name} onChange={set("business_name")} placeholder="Ex. : Auto-école Martin" />
      </Row>
      <Row label="Votre métier *" error={errors.activity}>
        <input style={inp("activity")} value={f.activity} onChange={set("activity")} placeholder="Ex. : auto-école" />
      </Row>
      <Row label="Ville *" error={errors.city}>
        <CityInput value={f.city} invalid={!!errors.city} onChange={(v) => { setF({ ...f, city: v }); setErrors({ ...errors, city: "" }); }} />
      </Row>
      <Row label="Ce que vous proposez *" hint="Une ou deux phrases, comme à un nouveau client." error={errors.offer}>
        <textarea rows={3} style={inp("offer")} value={f.offer} onChange={set("offer")} placeholder="Ex. : permis B accéléré et conduite accompagnée" />
      </Row>
      <Row label="Les entreprises que vous voulez contacter" hint="Facultatif.">
        <textarea rows={2} style={field} value={f.target} onChange={set("target")} placeholder="Ex. : entreprises qui recrutent des jeunes" />
      </Row>
      <Row label="Téléphone" hint="Facultatif." error={errors.phone}>
        <input style={inp("phone")} value={f.phone} onChange={set("phone")} placeholder="06 12 34 56 78" inputMode="tel" />
      </Row>
      <Row label="Site internet" hint="Facultatif." error={errors.website}>
        <input style={inp("website")} value={f.website} onChange={set("website")} placeholder="www.monsite.fr" />
      </Row>
      <Row label="Lien pour prendre rendez-vous" hint="Facultatif. Il sera ajouté dans vos messages." error={errors.booking_link}>
        <input style={inp("booking_link")} value={f.booking_link} onChange={set("booking_link")} placeholder="www.monsite.fr/rendez-vous" />
      </Row>
      <Row label="Signature des messages *" error={errors.signature}>
        <textarea rows={3} style={inp("signature")} value={f.signature} onChange={set("signature")} placeholder={"Cordialement,\nJean Martin\nAuto-école Martin"} />
      </Row>
      <Row label="Autre information utile" hint="Facultatif. Horaires, tarifs, points forts...">
        <textarea rows={2} style={field} value={f.extra} onChange={set("extra")} />
      </Row>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <button type="submit" disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</button>
        {onCancel && <button type="button" className="link" onClick={onCancel}>Annuler</button>}
      </div>
      {msg && <p style={{ marginTop: 12, color: "#c0392b" }}>{msg}</p>}
    </form>
  );
}
