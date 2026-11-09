import "./globals.css";

export const metadata = { title: "ProspectAI", description: "Prospection assistée par IA pour les agences" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
