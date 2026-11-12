"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { field } from "./ui";
import ProspectCard from "./ProspectCard";

export default function Prospects() {
  const [campaigns, setCampaigns] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("toutes");
  const [campaignId, setCampaignId] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [signal, setSignal] = useState("");
  const [source, setSource] = useState("");

  async function load() {
    const c = await supabase.from("campaigns").select("id,name").order("created_at", { ascending: false });
    const p = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    if (c.error || p.error) setError("Impossible de charger les prospects.");
    else {
      setCampaigns(c.data);
      setItems(p.data);
      if (!campaignId && c.data.length) setCampaignId(c.data[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.from("prospects").insert({
      campaign_id: campaignId,
      company: company.trim(),
      contact_name: contact.trim(),
      role: role.trim(),
      email: email.trim(),
      signal: signal.trim(),
      source: source.trim(),
    });
    setBusy(false);
    if (error) return setError("Le prospect n’a pas pu être ajouté. Réessayez.");
    setCompany("");
    setContact("");
    setRole("");
    setEmail("");
    setSignal("");
    setSource("");
    load();
  }

  if (loading) return <div className="empty">Chargement...</div>;

  if (campaigns.length === 0)
    return (
      <div className="card empty">
        Créez d’abord une campagne (menu « Campagnes »), puis revenez ajouter des prospects.
      </div>
    );

  const names = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));
  const shown = filter === "toutes" ? items : items.filter((p) => p.campaign_id === filter);

  return (
    <>
      <form onSubmit={add} className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Nouveau prospect</h3>
        <label>Campagne</label>
        <select style={field} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label>Entreprise</label>
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex. : Atelier Vernet Menuiserie" required />
        <label>Nom du contact</label>
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Ex. : Claire Vernet" />
        <label>Poste</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex. : Gérante" />
        <label>Email professionnel</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex. : claire@atelier-vernet.fr" />
        <label>Signal détecté (pourquoi la contacter)</label>
        <textarea
          style={field}
          rows={2}
          value={signal}
          onChange={(e) => setSignal(e.target.value)}
          placeholder="Ex. : Offre d’emploi publiée il y a 3 jours : chargé de communication"
        />
        <label>Source du signal (lien ou nom du site)</label>
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ex. : francetravail.fr" />
        <button disabled={busy}>{busy ? "Ajout..." : "Ajouter le prospect"}</button>
      </form>

      {error && <p className="err">{error}</p>}

      <div style={{ marginBottom: 12 }}>
        <label>Afficher</label>
        <select style={{ ...field, maxWidth: 360 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="toutes">Toutes les campagnes</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {shown.length === 0 && (
        <div className="card empty">Aucun prospect pour l’instant. Ajoutez le premier ci-dessus.</div>
      )}

      {shown.map((p) => (
        <ProspectCard key={p.id} p={p} campaignName={names[p.campaign_id]} onChanged={load} />
      ))}
    </>
  );
}
