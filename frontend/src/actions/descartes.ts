"use server";

import { revalidatePath } from "next/cache";
import { api, ErroApi } from "@/lib/api";
import { usuarioAtual } from "@/lib/auth";
import type { DescarteRegistrado } from "@/lib/tipos";

export type ResultadoDescarte =
  | { status: "ocioso" }
  | { status: "erro"; mensagem: string }
  | DescarteRegistrado;

/**
 * Server Action do formulário "Registrar descarte".
 * A regra de negócio (pesos por material, bônus, limite diário, conquistas) vive no backend:
 * aqui a action só repassa o formulário e revalida as telas afetadas.
 */
export async function registrarDescarte(
  _anterior: ResultadoDescarte,
  formData: FormData
): Promise<ResultadoDescarte> {
  const usuario = await usuarioAtual();
  if (!usuario) return { status: "erro", mensagem: "Entre na sua conta para registrar descartes." };

  try {
    const resultado = await api<DescarteRegistrado>("/api/descartes", {
      metodo: "POST",
      corpo: {
        pontoId: String(formData.get("pontoId") ?? ""),
        categoria: formData.get("categoria"),
        quantidade: Number(formData.get("quantidade") ?? 1),
      },
    });

    revalidatePath(`/pontos/${resultado.pontoId}`);
    revalidatePath("/perfil");
    revalidatePath("/ranking");

    return resultado;
  } catch (e) {
    // 422 = recusa prevista (o ponto não aceita o material, limite diário atingido...)
    if (e instanceof ErroApi) return { status: "erro", mensagem: e.message };
    throw e;
  }
}
