import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Resonant Voice",
  description:
    "Empathetic AI-powered assistive communication platform by Gemma AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable}`} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00327d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-surface text-on-surface min-h-screen font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
