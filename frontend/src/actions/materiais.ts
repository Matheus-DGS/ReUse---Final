"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ErroApi } from "@/lib/api";
import { usuarioAtual } from "@/lib/auth";
import type { EstadoFormulario } from "./pontos";

/** Server Action do cadastro colaborativo de material (`POST /api/items`). */
export async function cadastrarMaterial(
  _anterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login?redirecionar=/materiais/novo");

  const campos = {
    nomeItem: String(formData.get("nomeItem") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? ""),
    urlFoto: String(formData.get("urlFoto") ?? "").trim(),
  };

  let id: string;
  try {
    const { item } = await api<{ item: { id: string } }>("/api/items", { metodo: "POST", corpo: campos });
    id = item.id;
  } catch (e) {
    if (e instanceof ErroApi) return { erro: e.message, campos };
    throw e;
  }

  revalidatePath("/materiais");
  redirect(`/materiais/${id}`);
}
