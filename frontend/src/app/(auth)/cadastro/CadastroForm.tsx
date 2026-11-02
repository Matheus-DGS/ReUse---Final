"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { destinoSeguro } from "../destino";
import styles from "../auth.module.css";

export default function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destino = destinoSeguro(searchParams.get("redirecionar"));
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    const resposta = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    }).catch(() => null);

    if (!resposta?.ok) {
      const dados = await resposta?.json().catch(() => ({}));
      setErro(dados?.erro || "Não foi possível criar sua conta.");
      setCarregando(false);
      return;
    }

    router.push(destino === "/" ? "/pontos" : destino);
    router.refresh();
  }

  return (
    <form onSubmit={aoEnviar}>
      {erro && (
        <div className="erro" role="alert">
          {erro}
        </div>
      )}

      <div className="campo">
        <label htmlFor="nome">Nome</label>
        <input
          id="nome"
          type="text"
          autoComplete="name"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome completo"
        />
      </div>

      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
        />
      </div>

      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <button type="submit" className="btn btn-primario" style={{ width: "100%" }} disabled={carregando}>
        {carregando ? "Criando conta..." : "Criar conta"}
      </button>

      <p className={styles.rodape}>
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </form>
  );
}
