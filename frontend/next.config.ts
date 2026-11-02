import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Não gerar AGENTS.md/CLAUDE.md automaticamente na raiz do projeto
  agentRules: false,
  images: {
    // Materiais cadastrados pela comunidade podem usar fotos de qualquer domínio HTTPS
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
