export function cleanPhone(v) {
  return (v || "").replace(/[\s.\-()]/g, "");
}

export function validPhone(v) {
  const p = cleanPhone(v);
  return /^0[1-9]\d{8}$/.test(p) || /^\+33[1-9]\d{8}$/.test(p) || /^0033[1-9]\d{8}$/.test(p);
}

export function formatPhone(v) {
  let p = cleanPhone(v);
  if (p.startsWith("+33")) p = "0" + p.slice(3);
  else if (p.startsWith("0033")) p = "0" + p.slice(4);
  return p.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export function fixUrl(v) {
  const t = (v || "").trim();
  return /^https?:\/\//i.test(t) ? t : "https://" + t;
}

export function validUrl(v) {
  try {
    const u = new URL(fixUrl(v));
    return /^https?:$/.test(u.protocol) && /\.[a-z]{2,}$/i.test(u.hostname);
  } catch (e) {
    return false;
  }
}
