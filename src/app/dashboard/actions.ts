"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type UploadedPdf = {
  filename: string;
  text: string;
  pages: number;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type SavedDocument = {
  id: string;
  title: string;
  content: string;
  pages: number | null;
  created_at: string;
};

export type UserPlan = "free" | "pro";

export type UsageStatus = {
  plan: UserPlan;
  documentCount: number;
  maxDocuments: number | null;
  questionsToday: number;
  maxQuestionsPerDay: number | null;
};

const FREE_DOCUMENT_LIMIT = 5;
const FREE_DAILY_QUESTION_LIMIT = 30;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreateProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existingProfile?.plan) {
    return existingProfile.plan as UserPlan;
  }

  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, plan: "free" })
    .select("plan")
    .single();

  if (insertError) {
    throw insertError;
  }

  return (newProfile?.plan ?? "free") as UserPlan;
}

export async function getUsageStatus(): Promise<{ usage?: UsageStatus; error?: string }> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { error: "Bitte logge dich erneut ein." };
  }

  try {
    const plan = await getOrCreateProfile(supabase, user.id);
    const today = todayKey();

    const [{ count: documentCount, error: documentError }, { data: usageRow, error: usageError }] = await Promise.all([
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("usage").select("questions_count").eq("user_id", user.id).eq("usage_date", today).maybeSingle(),
    ]);

    if (documentError) throw documentError;
    if (usageError) throw usageError;

    return {
      usage: {
        plan,
        documentCount: documentCount ?? 0,
        maxDocuments: plan === "free" ? FREE_DOCUMENT_LIMIT : null,
        questionsToday: usageRow?.questions_count ?? 0,
        maxQuestionsPerDay: plan === "free" ? FREE_DAILY_QUESTION_LIMIT : null,
      },
    };
  } catch (error) {
    console.error(error);
    return { error: "Nutzungslimits konnten nicht geladen werden. Hast du die neue Supabase-SQL-Datei ausgeführt?" };
  }
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function createDocument(input: UploadedPdf): Promise<{ document?: SavedDocument; error?: string }> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { error: "Bitte logge dich erneut ein." };
  }

  if (!input.filename || !input.text) {
    return { error: "PDF-Daten fehlen." };
  }

  try {
    const plan = await getOrCreateProfile(supabase, user.id);

    if (plan === "free") {
      const { count, error: countError } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) throw countError;

      if ((count ?? 0) >= FREE_DOCUMENT_LIMIT) {
        return { error: `Free-Limit erreicht: Du kannst maximal ${FREE_DOCUMENT_LIMIT} PDFs speichern. Später schaltet Pro dieses Limit frei.` };
      }
    }
  } catch (error) {
    console.error(error);
    return { error: "Nutzungslimit konnte nicht geprüft werden. Hast du die neue Supabase-SQL-Datei ausgeführt?" };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title: input.filename,
      content: input.text,
      pages: input.pages,
    })
    .select("id,title,content,pages,created_at")
    .single();

  if (error) {
    console.error(error);
    return { error: "Dokument konnte nicht gespeichert werden. Hast du die Supabase-Tabellen schon angelegt?" };
  }

  revalidatePath("/dashboard");
  return { document: data };
}

export async function getDocumentMessages(documentId: string): Promise<{ messages?: ChatMessage[]; error?: string }> {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { error: "Bitte logge dich erneut ein." };
  }

  const { data, error } = await supabase
    .from("messages")
    .select("role,content")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return { error: "Chatverlauf konnte nicht geladen werden." };
  }

  return {
    messages: (data ?? []).map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    })),
  };
}

export async function askPdfQuestion(input: {
  question: string;
  documentId: string;
  documentText: string;
  history: ChatMessage[];
}): Promise<{ answer?: string; error?: string }> {
  const question = input.question.trim();
  const documentText = input.documentText.trim();

  if (!question) {
    return { error: "Bitte stelle eine Frage." };
  }

  if (!input.documentId) {
    return { error: "Bitte wähle zuerst ein gespeichertes Dokument aus." };
  }

  if (!documentText) {
    return { error: "Bitte lade zuerst eine PDF hoch." };
  }

  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { error: "Bitte logge dich erneut ein." };
  }

  const { data: documentOwner, error: ownerError } = await supabase
    .from("documents")
    .select("id")
    .eq("id", input.documentId)
    .eq("user_id", user.id)
    .single();

  if (ownerError || !documentOwner) {
    return { error: "Dokument wurde nicht gefunden oder gehört nicht zu deinem Account." };
  }

  try {
    const plan = await getOrCreateProfile(supabase, user.id);
    const today = todayKey();

    if (plan === "free") {
      const { data: usageRow, error: usageError } = await supabase
        .from("usage")
        .select("questions_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (usageError) throw usageError;

      if ((usageRow?.questions_count ?? 0) >= FREE_DAILY_QUESTION_LIMIT) {
        return { error: `Free-Limit erreicht: Du kannst maximal ${FREE_DAILY_QUESTION_LIMIT} Fragen pro Tag stellen. Später schaltet Pro dieses Limit frei.` };
      }
    }
  } catch (error) {
    console.error(error);
    return { error: "Nutzungslimit konnte nicht geprüft werden. Hast du die neue Supabase-SQL-Datei ausgeführt?" };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      error:
        "GROQ_API_KEY fehlt. Trage deinen Groq API-Key in .env.local ein und starte den Dev-Server neu.",
    };
  }

  try {
    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    const limitedHistory = input.history.slice(-6);

    await supabase.from("messages").insert({
      document_id: input.documentId,
      role: "user",
      content: question,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Du bist ein hilfreicher PDF-Assistent. Antworte auf Deutsch. Nutze nur den bereitgestellten PDF-Text. Wenn die Antwort nicht im Text steht, sage ehrlich, dass du es in der PDF nicht findest.",
        },
        {
          role: "user",
          content: `PDF-Text:\n${documentText.slice(0, 90_000)}`,
        },
        ...limitedHistory.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "Ich konnte keine Antwort erzeugen.";

    await supabase.from("messages").insert({
      document_id: input.documentId,
      role: "assistant",
      content: answer,
    });

    const today = todayKey();
    const { data: usageRow } = await supabase
      .from("usage")
      .select("questions_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle();

    await supabase.from("usage").upsert({
      user_id: user.id,
      usage_date: today,
      questions_count: (usageRow?.questions_count ?? 0) + 1,
    });

    revalidatePath("/dashboard");
    return { answer };
  } catch (error) {
    console.error(error);
    return { error: "KI-Antwort konnte nicht erzeugt werden. Prüfe deinen Groq API-Key und ob das Free-Tier-Limit erreicht wurde." };
  }
}
