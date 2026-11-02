"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./AssistenteFlutuante.module.css";

// O chat só é baixado quando o usuário abre o assistente pela primeira vez
const ChatEco = dynamic(() => import("./ChatEco"), { ssr: false });

export default function AssistenteFlutuante() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [convite, setConvite] = useState(false);

  // Convite discreto uma vez por sessão, alguns segundos após a primeira visita
  useEffect(() => {
    try {
      if (sessionStorage.getItem("reuse-eco-convite")) return;
    } catch {}
    const timer = setTimeout(() => setConvite(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  function dispensarConvite() {
    setConvite(false);
    try {
      sessionStorage.setItem("reuse-eco-convite", "1");
    } catch {}
  }

  // Na página dedicada, o chat já aparece embutido
  if (pathname === "/assistente") return null;

  return (
    <div className={styles.raiz}>
      {aberto && (
        <div className={styles.painel}>
          <ChatEco
            modo="flutuante"
            onFechar={() => setAberto(false)}
            onNavegou={() => {
              if (window.matchMedia("(max-width: 560px)").matches) setAberto(false);
            }}
          />
        </div>
      )}

      {!aberto && convite && (
        <div className={styles.convite} role="status">
          <button type="button" className={styles.conviteFechar} onClick={dispensarConvite} aria-label="Dispensar">
            ✕
          </button>
          <strong>Oi, eu sou o Eco! 🌱</strong>
          <span>Posso registrar seu descarte ou achar o ponto de coleta mais perto. É só pedir!</span>
        </div>
      )}

      <button
        type="button"
        className={styles.lancador}
        data-aberto={aberto}
        onClick={() => {
          setAberto((v) => !v);
          dispensarConvite();
        }}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar assistente Eco" : "Abrir assistente Eco"}
      >
        {aberto ? (
          <span aria-hidden="true">✕</span>
        ) : (
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <path fill="currentColor" d="M16 4C8.8 4 3 8.9 3 15c0 3 1.4 5.8 3.8 7.8L5.5 28l5.8-2.9c1.5.5 3 .7 4.7.7 7.2 0 13-4.9 13-11S23.2 4 16 4Z" />
            <path fill="#1f6d4c" d="M20.5 10.5c-5 .2-8.4 2.9-8.9 7.6 1.5-1.8 3.6-3 6-3.5-2.2 1.2-3.9 3-4.8 5.3 5.4.3 7.8-3.6 7.7-9.4Z" />
          </svg>
        )}
        {!aberto && <span className={styles.rotulo}>Fale com o Eco</span>}
      </button>
    </div>
  );
}
