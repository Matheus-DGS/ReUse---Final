"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Voz no navegador (Web Speech API): reconhecimento de fala (pt-BR) para ditar comandos
// e síntese de voz para ler as respostas do Eco em voz alta.

type Reconhecimento = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

type JanelaComVoz = Window & {
  SpeechRecognition?: new () => Reconhecimento;
  webkitSpeechRecognition?: new () => Reconhecimento;
};

export function useReconhecimentoDeFala(aoFinalizar: (texto: string) => void) {
  const [suportado, setSuportado] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [parcial, setParcial] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const rec = useRef<Reconhecimento | null>(null);
  const callback = useRef(aoFinalizar);
  callback.current = aoFinalizar;

  useEffect(() => {
    const janela = window as JanelaComVoz;
    setSuportado(Boolean(janela.SpeechRecognition || janela.webkitSpeechRecognition));
  }, []);

  const parar = useCallback(() => rec.current?.stop(), []);

  const ouvir = useCallback(() => {
    const janela = window as JanelaComVoz;
    const Classe = janela.SpeechRecognition || janela.webkitSpeechRecognition;
    if (!Classe) return;

    const r = new Classe();
    r.lang = "pt-BR";
    r.interimResults = true;
    r.continuous = false;
    let final = "";

    r.onresult = (e) => {
      let provisorio = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const resultado = e.results[i];
        if (resultado.isFinal) final += resultado[0].transcript;
        else provisorio += resultado[0].transcript;
      }
      setParcial(final || provisorio);
    };
    r.onerror = (e) => {
      setErro(e.error === "not-allowed" ? "Permita o uso do microfone no navegador." : "Não consegui ouvir. Tente de novo.");
    };
    r.onend = () => {
      setOuvindo(false);
      setParcial("");
      if (final.trim()) callback.current(final.trim());
    };

    setErro(null);
    setOuvindo(true);
    rec.current = r;
    r.start();
  }, []);

  return { suportado, ouvindo, parcial, erro, ouvir, parar };
}

export function useSinteseDeVoz() {
  const [suportado, setSuportado] = useState(false);

  useEffect(() => setSuportado("speechSynthesis" in window), []);

  const falar = useCallback((texto: string) => {
    if (!("speechSynthesis" in window) || !texto) return;
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 1.05;
    const voz = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("pt"));
    if (voz) fala.voice = voz;
    window.speechSynthesis.speak(fala);
  }, []);

  const calar = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { suportado, falar, calar };
}
