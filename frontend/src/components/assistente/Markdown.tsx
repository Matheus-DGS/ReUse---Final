import Link from "next/link";
import { Fragment, type ReactNode } from "react";

// Renderizador de Markdown mínimo e seguro (sem HTML bruto) para as respostas do assistente:
// **negrito**, *itálico*, [links](/caminho), listas com "- " ou "1. " e parágrafos.

function inline(texto: string, onLink?: () => void): ReactNode[] {
  const partes: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let chave = 0;

  while ((m = regex.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    if (m[1] !== undefined) partes.push(<strong key={chave++}>{inline(m[1], onLink)}</strong>);
    else if (m[2] !== undefined) partes.push(<em key={chave++}>{m[2]}</em>);
    else if (m[3] !== undefined) {
      const href = m[4];
      partes.push(
        href.startsWith("/") ? (
          <Link key={chave++} href={href} onClick={onLink}>
            {m[3]}
          </Link>
        ) : (
          <a key={chave++} href={href} target="_blank" rel="noopener noreferrer">
            {m[3]}
          </a>
        )
      );
    }
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

export default function Markdown({ texto, onLink }: { texto: string; onLink?: () => void }) {
  const blocos = texto.split(/\n{2,}/);

  return (
    <>
      {blocos.map((bloco, i) => {
        const linhas = bloco.split("\n");
        if (linhas.every((l) => /^- /.test(l))) {
          return (
            <ul key={i}>
              {linhas.map((l, j) => (
                <li key={j}>{inline(l.slice(2), onLink)}</li>
              ))}
            </ul>
          );
        }
        if (linhas.every((l) => /^\d+\. /.test(l))) {
          return (
            <ol key={i}>
              {linhas.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\d+\. /, ""), onLink)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i}>
            {linhas.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l, onLink)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

/** Versão em texto puro, para leitura em voz alta. */
export function textoParaFala(texto: string) {
  return texto
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/[*_#]/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/^\s*\d+\.\s/gm, "")
    .replace(/^- /gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
