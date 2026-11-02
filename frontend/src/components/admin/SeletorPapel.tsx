"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Papel } from "@/lib/tipos";
import styles from "@/app/admin/admin.module.css";

type SeletorPapelProps = {
  usuarioId: string;
  papel: Papel;
  /** Verdadeiro para a própria conta: o backend impede a autodegradação, então o campo trava. */
  euMesmo: boolean;
};

/** Promove um usuário a administrador ou devolve o papel de usuário comum. */
export default function SeletorPapel({ usuarioId, papel, euMesmo }: SeletorPapelProps) {
  const router = useRouter();
  const [valor, setValor] = useState<Papel>(papel);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function alterar(novo: Papel) {
    const anterior = valor;
    setValor(novo);
    setErro(null);
    setSalvando(true);

    const resposta = await fetch(`/api/admin/usuarios/${usuarioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ papel: novo }),
    }).catch(() => null);

    setSalvando(false);

    if (!resposta?.ok) {
      const dados = await resposta?.json().catch(() => ({}));
      setErro(dados?.erro || "Não foi possível alterar o papel.");
      setValor(anterior);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <select
        className={styles.seletor}
        value={valor}
        disabled={salvando || euMesmo}
        aria-label="Papel do usuário"
        title={euMesmo ? "Você não pode alterar o seu próprio papel" : "Alterar papel"}
        onChange={(e) => alterar(e.target.value as Papel)}
      >
        <option value="USUARIO">Usuário</option>
        <option value="ADMIN">Administrador</option>
      </select>
      {erro && (
        <span className={styles.mensagemErro} role="alert">
          {erro}
        </span>
      )}
    </>
  );
}
