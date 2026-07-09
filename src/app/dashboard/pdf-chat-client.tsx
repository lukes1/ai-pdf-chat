"use client";

import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from "react";
import {
  askPdfQuestion,
  ChatMessage,
  createDocument,
  getDocumentMessages,
  getUsageStatus,
  SavedDocument,
  UploadedPdf,
  UsageStatus,
} from "./actions";
import { createCheckoutSession } from "./billing-actions";

async function extractPdfText(file: File): Promise<UploadedPdf> {
  if (file.type !== "application/pdf") {
    throw new Error("Nur PDF-Dateien sind erlaubt.");
  }

  const maxSizeInMb = 8;
  if (file.size > maxSizeInMb * 1024 * 1024) {
    throw new Error(`Die Datei ist zu groß. Maximum: ${maxSizeInMb} MB.`);
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    pageTexts.push(text);
  }

  const text = pageTexts.join("\n\n").replace(/\s+/g, " ").trim();

  if (!text) {
    throw new Error("Ich konnte keinen Text aus dieser PDF extrahieren. Bei gescannten PDFs brauchst du später OCR.");
  }

  return {
    filename: file.name,
    text: text.slice(0, 120_000),
    pages: pdf.numPages,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PdfChatClient({ initialDocuments, initialUsage }: { initialDocuments: SavedDocument[]; initialUsage?: UsageStatus }) {
  const [documents, setDocuments] = useState<SavedDocument[]>(initialDocuments);
  const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(initialDocuments[0] ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStatus | undefined>(initialUsage);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isAsking, startAskTransition] = useTransition();

  const selectedDocumentStats = useMemo(() => {
    if (!selectedDocument) return null;

    return `${selectedDocument.pages ?? "?"} Seiten · ${selectedDocument.content.length.toLocaleString("de-AT")} Zeichen`;
  }, [selectedDocument]);

  async function refreshUsage() {
    const result = await getUsageStatus();
    if (result.usage) {
      setUsage(result.usage);
    }
  }

  async function selectDocument(document: SavedDocument) {
    setSelectedDocument(document);
    setError(null);
    setIsLoadingMessages(true);

    const result = await getDocumentMessages(document.id);
    if (result.error) {
      setError(result.error);
      setMessages([]);
    } else {
      setMessages(result.messages ?? []);
    }

    setIsLoadingMessages(false);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const extracted = await extractPdfText(file);
      const saved = await createDocument(extracted);

      if (saved.error || !saved.document) {
        throw new Error(saved.error ?? "Dokument konnte nicht gespeichert werden.");
      }

      setDocuments((currentDocuments) => [saved.document!, ...currentDocuments]);
      setSelectedDocument(saved.document);
      setMessages([]);
      await refreshUsage();
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "PDF konnte nicht verarbeitet werden.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedDocument) {
      setError("Bitte lade zuerst eine PDF hoch oder wähle ein gespeichertes Dokument aus.");
      return;
    }

    const currentQuestion = question.trim();
    if (!currentQuestion) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: currentQuestion }];
    setMessages(nextMessages);
    setQuestion("");

    startAskTransition(async () => {
      const result = await askPdfQuestion({
        question: currentQuestion,
        documentId: selectedDocument.id,
        documentText: selectedDocument.content,
        history: messages,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessages([...nextMessages, { role: "assistant", content: result.answer ?? "Keine Antwort erhalten." }]);
      await refreshUsage();
    });
  }

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">Plan</p>
              <h2 className="mt-2 text-2xl font-semibold">{usage?.plan === "pro" ? "Pro" : "Free"}</h2>
            </div>
            <span className="rounded-full border border-emerald-300/30 px-3 py-1 text-xs font-medium text-emerald-100">
              Limits aktiv
            </span>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-zinc-200 sm:grid-cols-2">
            <div className="rounded-2xl bg-zinc-950/50 p-4">
              <p className="text-zinc-400">Dokumente</p>
              <p className="mt-1 text-lg font-semibold">
                {usage ? `${usage.documentCount}/${usage.maxDocuments ?? "∞"}` : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-950/50 p-4">
              <p className="text-zinc-400">Fragen heute</p>
              <p className="mt-1 text-lg font-semibold">
                {usage ? `${usage.questionsToday}/${usage.maxQuestionsPerDay ?? "∞"}` : "—"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-400">
            Free ist auf 5 PDFs und 30 Fragen pro Tag begrenzt. Pro hebt diese Limits auf.
          </p>

          {usage?.plan !== "pro" ? (
            <form action={createCheckoutSession} className="mt-5">
              <button className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-zinc-950 transition hover:bg-zinc-200">
                Upgrade auf Askfolio Pro · 9 €/Monat
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              Pro aktiv: Du hast keine Free-Limits mehr.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">PDF hochladen</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Neue PDFs werden jetzt in Supabase gespeichert. Nach einem Reload kannst du sie wieder öffnen.
          </p>

          <div className="mt-6 space-y-4">
            <input
              name="pdf"
              type="file"
              accept="application/pdf"
              required
              onChange={handleUpload}
              className="block w-full rounded-2xl border border-dashed border-white/20 bg-zinc-950/60 p-5 text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-zinc-950"
            />
            <button
              disabled={isUploading}
              type="button"
              className="w-full rounded-xl bg-white px-4 py-3 font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "PDF wird verarbeitet und gespeichert..." : "PDF auswählen"}
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Meine Dokumente</h2>

          <div className="mt-5 space-y-3">
            {documents.length === 0 ? (
              <p className="text-sm text-zinc-500">Noch keine PDFs gespeichert.</p>
            ) : (
              documents.map((document) => {
                const isSelected = selectedDocument?.id === document.id;
                return (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => selectDocument(document)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : "border-white/10 bg-zinc-950/50 hover:bg-white/10"
                    }`}
                  >
                    <p className="line-clamp-1 font-medium text-white">📄 {document.title}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatDate(document.created_at)} · {document.pages ?? "?"} Seiten
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-sm text-zinc-400">Aktuelles Dokument</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {selectedDocument ? selectedDocument.title : "Kein Dokument ausgewählt"}
          </h2>
          {selectedDocumentStats ? <p className="mt-2 text-sm text-zinc-500">{selectedDocumentStats}</p> : null}
        </div>

        <div className="mt-6 min-h-96 space-y-4 rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
          {isLoadingMessages ? (
            <p className="text-sm text-zinc-500">Chatverlauf wird geladen...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {selectedDocument
                ? "Stelle deine erste Frage zu diesem Dokument. Der Chatverlauf wird gespeichert."
                : "Lade eine PDF hoch oder wähle links ein gespeichertes Dokument aus."}
            </p>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl p-4 text-sm leading-6 ${
                  message.role === "user" ? "ml-8 bg-white text-zinc-950" : "mr-8 bg-white/10 text-zinc-100"
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-60">
                  {message.role === "user" ? "Du" : "Askfolio"}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))
          )}
          {isAsking ? <p className="text-sm text-zinc-500">Antwort wird erzeugt...</p> : null}
        </div>

        <form onSubmit={handleAsk} className="mt-4 flex gap-3">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Frage zur PDF stellen..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-white"
          />
          <button
            disabled={isAsking || !selectedDocument}
            className="rounded-xl bg-white px-5 py-3 font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Senden
          </button>
        </form>
      </div>
    </section>
  );
}
