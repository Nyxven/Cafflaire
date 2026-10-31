import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";

const name = process.env.NEXT_PUBLIC_APP_NAME ?? "Cafflaire";
export const metadata: Metadata = { title: { default: name, template: `%s · ${name}` }, description: "Build your own coffee, barista style. Pickup or delivery." };
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FFF8F0" }, { media: "(prefers-color-scheme: dark)", color: "#18100C" }], width: "device-width", initialScale: 1 };

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
