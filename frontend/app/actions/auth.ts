"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Não foi possível encerrar a sessão: ${error.message}`);
  }

  revalidatePath("/");
  redirect("/login");
}
