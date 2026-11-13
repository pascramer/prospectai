function readProfile() {
  try {
    return JSON.parse(localStorage.getItem("profile") || "{}");
  } catch (e) {
    return {};
  }
}

export function buildPrompt({ agency, signature, p, firstEmail, reply }) {
  const prof = readProfile();
  const contact = [p.contact_name, p.role].filter(Boolean).join(", ") || "non renseigné";
  const signal = p.signal
    ? p.signal + (p.source ? " (source : " + p.source + ")" : "")
    : "non renseigné";

  const me = [];
  if (prof.business_name || prof.activity) {
    me.push("- Mon entreprise : " + [prof.business_name, prof.activity].filter(Boolean).join(", ") + (prof.city ? " (" + prof.city + ")" : ""));
  } else {
    me.push("- Mon entreprise : " + (agency || "[décris ton entreprise et ton offre]"));
  }
  if (prof.offer) me.push("- Ce que je propose : " + prof.offer);
  if (prof.target) me.push("- Qui je cherche à contacter : " + prof.target);
  if (prof.extra) me.push("- Informations utiles que tu peux utiliser : " + prof.extra);
  if (prof.website) me.push("- Mon site : " + prof.website);
  if (prof.phone) me.push("- Mon téléphone : " + prof.phone);
  if (prof.booking_link) me.push("- Mon lien de rendez-vous : " + prof.booking_link);
  me.push("- Ma signature : " + (prof.signature || signature));

  const lines = [
    "Tu es un assistant commercial qui aide une entreprise à répondre aux réponses reçues après un email de prospection. Écris en français, de façon naturelle, comme un humain.",
    "",
    "## Mon entreprise",
    ...me,
    "",
    "## Le prospect",
    "- Entreprise : " + p.company,
    "- Contact : " + contact,
    "- Fait cité dans mon premier email : " + signal,
    "- Mon premier email : " + (firstEmail ? "« " + firstEmail + " »" : "non disponible"),
    "",
    "## La réponse reçue",
    '"""',
    reply,
    '"""',
    "",
    "## Ce que tu dois faire",
    "",
    "1. Analyse le sens réel de la réponse, pas seulement les mots : négations, ironie, demandes cachées, ton, et ce que la personne attend vraiment de moi.",
    "2. Résume en une phrase ce que la personne dit, puis indique ton niveau de certitude (élevé, moyen, faible). Si c’est ambigu, dis-le.",
    "3. Propose 3 réponses qui diffèrent par la stratégie, pas seulement par les mots. Donne à chacune un nom court.",
    "4. Chaque réponse doit : reprendre un élément précis de ce que la personne a écrit (un jour, une heure, une objection, une question) ; répondre directement à sa demande avant de proposer autre chose ; faire 40 à 90 mots ; ne demander qu’une seule action ; finir par ma signature.",
    "5. Adapte la stratégie à la situation : si elle donne des disponibilités, confirme un horaire précis dans sa plage ; si elle est indisponible, propose d’autres créneaux ; si elle pose une question, réponds-y d’abord avec les informations ci-dessus ; si elle objecte, reconnais l’objection sans la contredire ; si elle est la mauvaise personne, demande qui contacter ; si elle veut qu’on ne la contacte plus, ne vends rien et confirme l’arrêt ; si c’est une réponse automatique, n’écris pas de réponse et indique quand relancer.",
    "",
    "## Règles",
    "- Utilise uniquement les informations données ci-dessus. N’invente aucun fait, chiffre, tarif, référence client ou délai. Si une information manque, mets-la entre crochets, par exemple [tarif].",
    "- Si un lien de rendez-vous est donné, utilise-le plutôt qu’un crochet.",
    "- Pas de flatterie générique, pas de fausse urgence, pas de formule toute faite comme « N’hésitez pas à revenir vers moi ».",
    "- Ne répète pas mon premier email.",
    "- Garde le même niveau de formalité que la personne.",
    "",
    "## Format de ta réponse",
    "**Ce que la personne dit :** [une phrase]",
    "**Certitude :** [niveau + raison courte]",
    "",
    "**Réponse 1 – [nom de la stratégie]**",
    "[texte]",
    "",
    "**Réponse 2 – [nom de la stratégie]**",
    "[texte]",
    "",
    "**Réponse 3 – [nom de la stratégie]**",
    "[texte]",
    "",
    "**Ma recommandation :** [laquelle choisir et pourquoi, en une phrase]",
  ];

  return lines.join("\n");
}
