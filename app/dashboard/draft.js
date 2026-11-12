export function draft(p, tone, signature) {
  const first = (p.contact_name || "").trim().split(" ")[0];
  const hello = first ? "Bonjour " + first + "," : "Bonjour,";
  const fact = (p.signal || "").trim().replace(/\.$/, "");
  const lower = fact.charAt(0).toLowerCase() + fact.slice(1);
  let body;
  if (tone === "chaleureux") {
    body =
      hello + "\n\nEn découvrant " + p.company + ", j’ai vu que " + lower +
      ". Cela m’a donné quelques idées que j’aimerais partager avec vous.\n\n" +
      "Si vous le souhaitez, nous pouvons en parler 15 minutes cette semaine, sans engagement. Cela vous dirait ?\n\n" +
      "Bien à vous,\n" + signature;
  } else if (tone === "direct") {
    body =
      hello + "\n\n" + p.company + " : " + lower + ".\n\n" +
      "Nous aidons les entreprises dans cette situation. Un appel de 15 minutes cette semaine ?\n\n" + signature;
  } else {
    body =
      hello + "\n\nJ’ai remarqué ceci chez " + p.company + " : " + lower + ".\n\n" +
      "Nous accompagnons des entreprises dans cette situation. Seriez-vous disponible pour un échange de 15 minutes cette semaine afin d’en discuter ?\n\n" +
      "Cordialement,\n" + signature;
  }
  return (
    body +
    "\n\n—\nVos coordonnées proviennent de sources publiques" +
    (p.source ? " (" + p.source + ")" : "") +
    ". Pour ne plus être contacté, répondez « stop »."
  );
}
