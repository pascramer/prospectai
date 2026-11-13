"use client";
import { useRef, useState } from "react";
import { field } from "./ui";

export function isCityValid(v) {
  return /\(\d{5}[^)]*\)\s*$/.test(v || "");
}

function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-']/g, " ");
}

function codes(c) {
  const z = c.codesPostaux || [];
  return z.length > 1 ? z[0] + " à " + z[z.length - 1] : z[0] || "";
}

export default function CityInput({ value, onChange, invalid }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [fail, setFail] = useState(false);
  const timer = useRef(null);
  const seq = useRef(0);

  async function search(q) {
    const id = ++seq.current;
    try {
      const url =
        "https://geo.api.gouv.fr/communes?nom=" + encodeURIComponent(q) + "&fields=nom,code,codesPostaux&boost=population&limit=30";
      const r = await fetch(url);
      const data = await r.json();
      if (id !== seq.current) return;
      const n = norm(q);
      const starts = data.filter((c) => norm(c.nom).startsWith(n));
      setList((starts.length ? starts : data).slice(0, 8));
      setFail(false);
      setOpen(true);
    } catch (e) {
      if (id === seq.current) {
        setFail(true);
        setList([]);
      }
    }
  }

  function type(text) {
    onChange(text);
    clearTimeout(timer.current);
    seq.current++;
    const q = text.split("(")[0].trim();
    if (!q || isCityValid(text)) {
      setList([]);
      return;
    }
    timer.current = setTimeout(() => search(q), 250);
  }

  function pick(c) {
    onChange(c.nom + " (" + codes(c) + ")");
    setList([]);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        style={{ ...field, borderColor: invalid ? "#c0392b" : undefined }}
        value={value}
        placeholder="Commencez à taper, par exemple : Romainville"
        autoComplete="off"
        onChange={(e) => type(e.target.value)}
        onFocus={() => list.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && list.length > 0 && (
        <div
          className="card"
          style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 20, padding: 4, marginTop: 4, maxHeight: 260, overflow: "auto" }}
        >
          {list.map((c) => (
            <div
              key={c.code}
              style={{ padding: "8px 10px", cursor: "pointer", borderRadius: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(127,127,127,.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
            >
              <strong>{c.nom}</strong> <span style={{ color: "var(--mu)" }}>{codes(c)}</span>
            </div>
          ))}
        </div>
      )}
      {isCityValid(value) && <div style={{ fontSize: 13, color: "#2e7d32", marginTop: 4 }}>✓ Ville validée</div>}
      {fail && (
        <div style={{ fontSize: 13, color: "#c0392b", marginTop: 4 }}>
          La liste des villes est indisponible. Vérifiez votre connexion internet.
        </div>
      )}
    </div>
  );
}
