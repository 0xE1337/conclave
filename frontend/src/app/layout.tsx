import type { Metadata } from "next";
import { Nunito, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
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
  metadataBase: new URL("https://conclave-rho.vercel.app"),
  title: {
    default: "Conclave — Confidential Private Credit",
    template: "%s · Conclave",
  },
  description:
    "Confidential private-credit pool for tokenized RWA on Zama fhEVM. Encrypted positions, ERC-3643-inspired KYC tier gating, anti-bribery encrypted underwriting committee, opt-in regulator disclosure.",
  keywords: [
    "fhEVM",
    "Zama",
    "FHE",
    "confidential finance",
    "private credit",
    "RWA",
    "tokenized",
    "ERC-3643",
    "selective disclosure",
    "anti-bribery voting",
  ],
  authors: [{ name: "0xE1337" }],
  openGraph: {
    type: "website",
    title: "Conclave — Confidential Private Credit",
    description:
      "Confidential private credit, decided in cryptographic conclave. fhEVM × tokenized RWA × ERC-3643.",
    url: "https://conclave-rho.vercel.app",
    siteName: "Conclave",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conclave — Confidential Private Credit",
    description:
      "Confidential private credit, decided in cryptographic conclave. fhEVM × tokenized RWA.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${nunito.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
