"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "@/app/admin/admin.module.css";

type BotaoAcaoProps = {
  /** Caminho da API administrativa, ex.: `/api/admin/pontos/abc` */
  caminho: string;
  metodo: "PATCH" | "DELETE" | "POST";
  corpo?: unknown;
  /** Texto do `confirm()` para ações destrutivas. Sem ele, a ação é executada direto. */
  confirmar?: string;
  variante?: "aprovar" | "perigo" | "neutro";
  children: React.ReactNode;
};

/**
 * Pequena ilha interativa das tabelas do painel: chama a API administrativa (pelo proxy do
 * Next.js, que anexa o token da sessão) e recarrega os dados do Server Component.
 */
export default function BotaoAcao({
  caminho,
  metodo,
  corpo,
  confirmar,
  variante = "neutro",
  children,
}: BotaoAcaoProps) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();
  const [enviando, setEnviando] = useState(false);

  async function executar() {
    if (confirmar && !window.confirm(confirmar)) return;

    setErro(null);
    setEnviando(true);

    const resposta = await fetch(caminho, {
      method: metodo,
      headers: corpo !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    }).catch(() => null);

    setEnviando(false);

    if (!resposta?.ok) {
      const dados = await resposta?.json().catch(() => ({}));
      setErro(dados?.erro || "Não foi possível concluir a ação.");
      return;
    }

    iniciarTransicao(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        className={styles.botao}
        data-variante={variante}
        onClick={executar}
        disabled={enviando || pendente}
      >
        {enviando || pendente ? "..." : children}
      </button>
      {erro && (
        <span className={styles.mensagemErro} role="alert">
          {erro}
        </span>
      )}
    </>
  );
}
