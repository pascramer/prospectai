import { supabase } from "../../lib/supabase";

export const CATEGORIES = {
  interesse: "Intéressé",
  plustard: "Plus tard",
  non: "Pas concerné",
  mauvaise: "Mauvaise personne",
  desinscription: "Désinscription",
  auto: "Réponse automatique",
  autre: "À classer",
};

function norm(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'");
}

const RULES = [
  ["desinscription", /desinscri|ne plus (me|nous) contacter|retirez|supprimez (mon|mes|notre)|\bstop\b/],
  ["auto", /reponse automatique|auto-?reply|out of office|hors du bureau|absent|en conges/],
  ["non", /pas interess|non merci|pas concerne|ne nous interesse pas|ne m'interesse pas|aucun besoin|pas besoin|deja un prestataire|deja une agence/],
  ["mauvaise", /pas la bonne personne|mauvaise personne|contactez plutot|adressez-vous|transmis|n'est plus (dans|chez)|a quitte/],
  ["plustard", /plus tard|pas le moment|rappelez|recontactez|dans quelques mois|trimestre|prochain|septembre|janvier|rentree/],
  ["interesse", /interess|rendez-vous|rdv|appel|disponible|volontiers|d'accord|\boui\b|plus d'info|envoyez|pourquoi pas/],
];

export function classify(text) {
  const t = norm(text);
  for (const [category, rule] of RULES) {
    if (rule.test(t)) return category;
  }
  return "autre";
}

export function suggestion(category, p, signature) {
  const first = (p.contact_name || "").trim().split(" ")[0];
  const hello = first ? "Bonjour " + first + "," : "Bonjour,";
  if (category === "interesse")
    return (
      hello +
      "\n\nMerci pour votre retour ! Je vous propose un échange de 15 minutes : indiquez-moi vos disponibilités cette semaine, ou choisissez un créneau ici : [lien de prise de rendez-vous].\n\nCordialement,\n" +
      signature
    );
  if (category === "plustard")
    return (
      hello +
      "\n\nMerci pour votre réponse. Je reviens vers vous dans trois mois, sauf si vous préférez que je ne vous recontacte pas.\n\nCordialement,\n" +
      signature
    );
  if (category === "mauvaise")
    return (
      hello +
      "\n\nMerci de me l’indiquer. Pourriez-vous me dire qui serait la bonne personne pour ce sujet ?\n\nCordialement,\n" +
      signature
    );
  return "";
}

export async function applyCategory(p, category) {
  if (!p || category === "auto") return;
  const status = category === "desinscription" ? "désinscrit" : "a répondu";
  await supabase.from("prospects").update({ status }).eq("id", p.id);
  if (category === "desinscription" && p.email) {
    await supabase.from("suppressions").insert({ email: p.email.trim().toLowerCase() });
  }
}
