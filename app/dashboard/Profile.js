"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ProfileForm, { EMPTY, remember } from "./ProfileForm";

function Item({ label, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 12, color: "var(--mu)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ marginTop: 2, whiteSpace: "pre-line" }}>{children}</div>
    </div>
  );
}

function Link({ url }) {
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {url.replace(/^https?:\/\//, "")}
    </a>
  );
}

export default function Profile() {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.from("business_profile").select("*").maybeSingle().then((r) => {
      if (r.data) {
        const d = {};
        Object.keys(EMPTY).forEach((k) => (d[k] = r.data[k] || ""));
        setData(d);
        remember(d);
      }
      setReady(true);
    });
  }, []);

  if (!ready) return <div className="empty">Chargement...</div>;

  if (!data || editing) {
    return (
      <ProfileForm
        data={data}
        onSaved={(d) => {
          setData(d);
          setEditing(false);
        }}
        onCancel={data ? () => setEditing(false) : null}
      />
    );
  }

  const initial = (data.business_name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="card" style={{ maxWidth: 680, padding: 0, overflow: "hidden" }}>
      <div style={{ height: 84, background: "var(--ac)" }} />
      <div style={{ padding: "0 28px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: -40, gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              width: 80, height: 80, borderRadius: "50%", background: "var(--bg)", color: "var(--tx)",
              border: "4px solid var(--sf)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <button type="button" onClick={() => setEditing(true)}>Modifier mon profil</button>
        </div>
        <h2 style={{ margin: "14px 0 2px" }}>{data.business_name}</h2>
        <div style={{ color: "var(--mu)" }}>{[data.activity, data.city].filter(Boolean).join(" · ")}</div>
        <p style={{ marginTop: 16, whiteSpace: "pre-line" }}>{data.offer}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0 24px" }}>
          {data.phone && <Item label="Téléphone">{data.phone}</Item>}
          {data.website && <Item label="Site internet"><Link url={data.website} /></Item>}
          {data.booking_link && <Item label="Prise de rendez-vous"><Link url={data.booking_link} /></Item>}
        </div>
        {data.target && <Item label="Entreprises visées">{data.target}</Item>}
        {data.extra && <Item label="Informations utiles">{data.extra}</Item>}
        <Item label="Signature des messages">{data.signature}</Item>
      </div>
    </div>
  );
}
