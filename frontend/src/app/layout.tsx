import type { Metadata } from "next";
import { Nunito, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Conclave — Confidential Private Credit",
  description:
    "Confidential private-credit pool for tokenized RWA. Encrypted positions, anti-bribery underwriting conclave, opt-in regulator disclosure. Powered by Zama fhEVM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
