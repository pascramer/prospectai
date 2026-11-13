function readProfile() {
  try {
    return JSON.parse(localStorage.getItem("profile") || "{}");
  } catch (e) {
    return {};
  }
}

export function draft(p, tone, signature) {
  const prof = readProfile();
  const first = (p.contact_name || "").trim().split(" ")[0];
  const hello = first ? "Bonjour " + first + "," : "Bonjour,";
  const fact = (p.signal || "").trim().replace(/\.$/, "");
  const lower = fact.charAt(0).toLowerCase() + fact.slice(1);

  const offer = prof.offer
    ? "Chez " + (prof.business_name || "nous") + ", nous proposons : " + prof.offer.replace(/\.$/, "") + "."
    : "Nous accompagnons des entreprises dans cette situation.";
  const link = prof.booking_link ? " Vous pouvez choisir un créneau ici : " + prof.booking_link + "." : "";

  let body;
  if (tone === "chaleureux") {
    body =
      hello + "\n\nEn découvrant " + p.company + ", j’ai vu que " + lower +
      ". Cela m’a donné quelques idées que j’aimerais partager avec vous.\n\n" +
      offer + "\n\n" +
      "Si vous le souhaitez, nous pouvons en parler 15 minutes cette semaine, sans engagement." + link + " Cela vous dirait ?\n\n" +
      "Bien à vous,\n" + signature;
  } else if (tone === "direct") {
    body =
      hello + "\n\n" + p.company + " : " + lower + ".\n\n" +
      offer + "\n\n" +
      "Un appel de 15 minutes cette semaine ?" + link + "\n\n" + signature;
  } else {
    body =
      hello + "\n\nJ’ai remarqué ceci chez " + p.company + " : " + lower + ".\n\n" +
      offer + "\n\n" +
      "Seriez-vous disponible pour un échange de 15 minutes cette semaine afin d’en discuter ?" + link + "\n\n" +
      "Cordialement,\n" + signature;
  }
  return (
    body +
    "\n\n—\nVos coordonnées proviennent de sources publiques" +
    (p.source ? " (" + p.source + ")" : "") +
    ". Pour ne plus être contacté, répondez « stop »."
  );
}
