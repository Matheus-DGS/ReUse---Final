import type { Metadata } from "next";
import ChatEco from "@/components/assistente/ChatEcoCarregado";
import styles from "./assistente.module.css";

export const metadata: Metadata = {
  title: "Assistente Eco",
  description: "Converse com o Eco, o assistente virtual do ReUse! criado com IBM Watson: ele executa tarefas e tira dúvidas sobre a plataforma.",
};

const TAREFAS = [
  { comando: "Registrei 2 sacolas de vidro no Ecoponto Vila Mariana", resultado: "Registra o descarte e soma EcoPontos" },
  { comando: "Onde descarto pilhas perto de mim?", resultado: "Lista os pontos mais próximos que aceitam o material" },
  { comando: "Desfazer meu último descarte", resultado: "Cancela um registro feito por engano" },
  { comando: "Favoritar garrafa pet", resultado: "Salva o material nos seus favoritos" },
  { comando: "Quero cadastrar um material", resultado: "Cria um novo item no catálogo, passo a passo" },
  { comando: "Quantos EcoPontos eu tenho?", resultado: "Mostra nível, progresso e conquistas" },
  { comando: "Qual a missão de hoje?", resultado: "Informa a categoria que vale bônus hoje" },
  { comando: "Me leva para o ranking", resultado: "Abre a página pedida" },
];

const DUVIDAS = [
  "Como registro um descarte?",
  "Como sugerir um novo ponto de coleta?",
  "Como funcionam os EcoPontos e níveis?",
  "Como descartar vidro quebrado?",
  "O que é um PEV?",
  "O botão “Perto de mim” não funciona",
  "Por que não ganhei pontos?",
  "Esqueci minha senha",
];

export default function AssistentePage() {
  return (
    <div className={`wrap ${styles.pagina}`}>
      <div className={styles.grade}>
        <div className={styles.lateral}>
          <div className="anima-entrada">
            <p className="eyebrow">ReUse! com voz · IBM Watson</p>
            <h1 className={styles.titulo}>Converse com o Eco</h1>
            <p className={styles.descricao}>
              O Eco é o assistente virtual do ReUse!. Ele entende o que você escreve ou fala, <strong>executa
              tarefas na plataforma</strong> por você e <strong>explica, passo a passo</strong>, como usar cada
              recurso. Toque no microfone para falar, ou no 🔈 para ouvir as respostas.
            </p>
          </div>

          <section className={styles.bloco}>
            <h2 className={styles.h2}>
              <span aria-hidden="true">⚡</span> Tarefas que ele executa
            </h2>
            <ul className={styles.tarefas}>
              {TAREFAS.map((t) => (
                <li key={t.comando}>
                  <span className={styles.comando}>“{t.comando}”</span>
                  <span className={styles.resultado}>{t.resultado}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.bloco}>
            <h2 className={styles.h2}>
              <span aria-hidden="true">💬</span> Dúvidas que ele responde
            </h2>
            <ul className={styles.duvidas}>
              {DUVIDAS.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>

          <p className={styles.nota}>
            Tarefas que alteram seus dados, como registrar descartes, pedem sua confirmação antes e exigem login.
            As respostas são processadas pelo IBM watsonx Assistant.
          </p>
        </div>

        <div className={styles.chat}>
          <ChatEco modo="pagina" />
        </div>
      </div>
    </div>
  );
}
