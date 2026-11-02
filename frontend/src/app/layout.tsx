import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AssistenteFlutuante from "@/components/assistente/AssistenteFlutuante";

// next/font: fontes baixadas no build e servidas pelo próprio domínio (sem layout shift)
const display = Fraunces({ subsets: ["latin"], variable: "--fonte-display", display: "swap" });
const corpo = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fonte-corpo",
  display: "swap",
});
const dado = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--fonte-dado",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ReUse! — Recicle com propósito",
    template: "%s · ReUse!",
  },
  description:
    "Encontre pontos de coleta perto de você, aprenda a separar resíduos e ganhe EcoPontos a cada descarte consciente.",
  applicationName: "ReUse!",
  keywords: ["reciclagem", "pontos de coleta", "ecoponto", "coleta seletiva", "sustentabilidade"],
};

export const viewport: Viewport = {
  themeColor: "#1f6d4c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable} ${dado.variable}`}>
      <body>
        <a href="#conteudo" className="visually-hidden">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
        <AssistenteFlutuante />
      </body>
    </html>
  );
}
