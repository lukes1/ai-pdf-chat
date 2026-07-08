import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUsageStatus, signOut, SavedDocument } from "./actions";
import { PdfChatClient } from "./pdf-chat-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id,title,content,pages,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  const { usage, error: usageError } = await getUsageStatus();

  if (usageError) {
    console.error(usageError);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">Eingeloggt als {user.email}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Dashboard</h1>
          </div>

          <form action={signOut}>
            <button className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10">
              Logout
            </button>
          </form>
        </div>

        <PdfChatClient initialDocuments={(documents ?? []) as SavedDocument[]} initialUsage={usage} />
      </div>
    </main>
  );
}
