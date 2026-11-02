"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { destinoSeguro } from "../destino";
import styles from "../auth.module.css";

// Contas criadas pelo seed do backend, usadas na demonstração do projeto
const CONTAS_DEMO = [
  { rotulo: "Usuário", email: "equipe@reuse.app", senha: "reuse123" },
  { rotulo: "Administração", email: "admin@reuse.app", senha: "reuse123" },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destino = destinoSeguro(searchParams.get("redirecionar"));
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const resposta = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    }).catch(() => null);

    if (!resposta?.ok) {
      const dados = await resposta?.json().catch(() => ({}));
      setErro(dados?.erro || "Não foi possível entrar. Verifique sua conexão e tente novamente.");
      setCarregando(false);
      return;
    }

    router.push(destino);
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
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <button type="submit" className="btn btn-primario" style={{ width: "100%" }} disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar"}
      </button>

      <p className={styles.rodape}>
        Ainda não tem conta?{" "}
        <Link href={destino !== "/" ? `/cadastro?redirecionar=${encodeURIComponent(destino)}` : "/cadastro"}>
          Criar conta
        </Link>
      </p>

      <div className={styles.demo}>
        <p>
          Contas de demonstração (senha <code>reuse123</code>):{" "}
          {CONTAS_DEMO.map((c) => c.email).join(" · ")}
        </p>
        {CONTAS_DEMO.map((conta) => (
          <button
            key={conta.email}
            type="button"
            className="btn btn-secundario btn-pequeno"
            onClick={() => {
              setEmail(conta.email);
              setSenha(conta.senha);
            }}
          >
            {conta.rotulo}
          </button>
        ))}
      </div>
    </form>
  );
}
