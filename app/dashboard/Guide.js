"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const TABLES = ["business_profile", "campaigns", "prospects", "messages", "replies"];

const HINTS = [
  "Remplissez le formulaire, puis cliquez sur Enregistrer.",
  "Créez votre première campagne pour continuer.",
  "Ajoutez au moins un prospect pour continuer.",
  "Préparez au moins un message pour continuer.",
  "Enregistrez une réponse reçue, ou terminez dès maintenant.",
];

async function stepDone(step) {
  const r = await supabase.from(TABLES[step]).select("*", { count: "exact", head: true });
  return (r.count || 0) > 0;
}

export async function firstTodo() {
  for (let i = 0; i < TABLES.length; i++) {
    if (!(await stepDone(i))) return i;
  }
  return -1;
}

export function StepsBar({ current, labels }) {
  return (
    <div style={{ display: "flex", gap: 8, margin: "0 0 22px", flexWrap: "wrap" }}>
      {labels.map((l, i) => (
        <div key={l} style={{ flex: "1 1 90px", minWidth: 90 }}>
          <div style={{ height: 4, borderRadius: 2, background: i <= current ? "var(--ac)" : "var(--bd)" }} />
          <div style={{ fontSize: 12, marginTop: 4, color: i === current ? "var(--tx)" : "var(--mu)", fontWeight: i === current ? 600 : 400 }}>
            {i + 1}. {l}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StepFooter({ step, nextLabel, onNext }) {
  const [done, setDone] = useState(false);
  const [auto, setAuto] = useState(false);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;

  useEffect(() => {
    let alive = true;
    let initial = null;
    let timer = null;
    setDone(false);
    setAuto(false);
    async function check() {
      const d = await stepDone(step);
      if (!alive) return;
      setDone(d);
      if (initial === null) {
        initial = d;
        return;
      }
      if (d && !initial && step <= 1) {
        clearInterval(poll);
        setAuto(true);
        timer = setTimeout(() => alive && nextRef.current(), 1800);
      }
    }
    const poll = setInterval(check, 2500);
    check();
    return () => {
      alive = false;
      clearInterval(poll);
      clearTimeout(timer);
    };
  }, [step]);

  return (
    <div className="card" style={{ marginTop: 24, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span style={{ color: "var(--mu)" }}>
        {auto ? "✓ Étape terminée, on passe à la suite..." : done ? "✓ Cette étape est faite. Vous pouvez continuer." : HINTS[step]}
      </span>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {!done && (
          <button type="button" className="link" onClick={onNext}>
            Passer
          </button>
        )}
        <button type="button" disabled={!done} onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
