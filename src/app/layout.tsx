import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";

const name = process.env.NEXT_PUBLIC_APP_NAME ?? "Brew Your Own";
export const metadata: Metadata = { title: { default: name, template: `%s · ${name}` }, description: "Build your own coffee, barista style. Pickup or delivery." };
export const viewport: Viewport = { themeColor: "#FFF8F0", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
