// template.tsx é remontado a cada navegação — usado para a transição horizontal entre telas
// definida no Plano de Animações (seção 5.1).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="transicao-tela">{children}</div>;
}
