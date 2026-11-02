"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ErroApi } from "@/lib/api";
import { usuarioAtual } from "@/lib/auth";
import { ehCategoria } from "@/lib/categorias";

export type EstadoFormulario = {
  erro?: string;
  campos?: Record<string, string>;
};

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

/** Server Action da sugestão colaborativa de ponto de coleta (`POST /api/pontos`). */
export async function sugerirPonto(
  _anterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login?redirecionar=/pontos/novo");

  const campos = {
    nome: texto(formData, "nome"),
    tipo: texto(formData, "tipo"),
    descricao: texto(formData, "descricao"),
    endereco: texto(formData, "endereco"),
    bairro: texto(formData, "bairro"),
    cidade: texto(formData, "cidade") || "São Paulo",
    horario: texto(formData, "horario"),
    telefone: texto(formData, "telefone"),
    latitude: texto(formData, "latitude"),
    longitude: texto(formData, "longitude"),
  };
  const materiais = formData.getAll("materiais").filter(ehCategoria);

  let id: string;
  try {
    const { ponto } = await api<{ ponto: { id: string } }>("/api/pontos", {
      metodo: "POST",
      corpo: { ...campos, materiais },
    });
    id = ponto.id;
  } catch (e) {
    // Os campos voltam ao formulário em caso de erro (o React reinicia o <form> após a action)
    if (e instanceof ErroApi) {
      return { erro: e.message, campos: { ...campos, materiais: materiais.join(",") } };
    }
    throw e;
  }

  revalidatePath("/pontos");
  redirect(`/pontos/${id}?novo=1`);
}
