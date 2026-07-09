"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function getCredentials(formData: FormData): { email: string; password: string } | { error: string } {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort ausfüllen." };
  }

  return { email, password };
}

export async function signIn(formData: FormData) {
  const credentials = getCredentials(formData);

  if ("error" in credentials) {
    redirect(`/auth/login?message=${encodeURIComponent(credentials.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    redirect(`/auth/login?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const credentials = getCredentials(formData);

  if ("error" in credentials) {
    redirect(`/auth/login?message=${encodeURIComponent(credentials.error)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    redirect(`/auth/login?message=${encodeURIComponent(error.message)}&type=error`);
  }

  revalidatePath("/", "layout");

  if (!data.session) {
    redirect(
      `/auth/login?message=${encodeURIComponent(
        "Registrierung erfolgreich. Bitte prüfe deine E-Mail und bestätige deinen Account. Schau auch im Spam-Ordner nach."
      )}&type=success`
    );
  }

  redirect("/dashboard");
}
