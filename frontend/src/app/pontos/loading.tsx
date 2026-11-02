// Exibido automaticamente pelo App Router enquanto a página de pontos busca os dados
export default function CarregandoPontos() {
  return (
    <div className="wrap" style={{ paddingTop: 40 }} aria-busy="true" aria-label="Carregando pontos de coleta">
      <div className="esqueleto" style={{ height: 150, marginBottom: 28 }} />
      <div className="esqueleto" style={{ height: 110, marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 400px) 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="esqueleto" style={{ height: 150 }} />
          ))}
        </div>
        <div className="esqueleto" style={{ minHeight: 470 }} />
      </div>
    </div>
  );
}
