import Link from "next/link";

const features = [
  {
    title: "PDF hochladen",
    description: "Lade Skripte, Berichte, Verträge oder Handbücher hoch und nutze sie sofort im Chat.",
  },
  {
    title: "Fragen stellen",
    description: "Stelle konkrete Fragen zum Dokument und erhalte Antworten auf Basis des Inhalts.",
  },
  {
    title: "Verlauf behalten",
    description: "Deine Dokumente und Chats bleiben gespeichert, damit du später weiterarbeiten kannst.",
  },
];

const useCases = ["Studium", "Verträge", "Berichte", "Handbücher", "Recherche", "Prüfungsvorbereitung"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          DocuMind
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/auth/login" className="text-zinc-300 transition hover:text-white">
            Login
          </Link>
          <Link
            href="/auth/login"
            className="rounded-full bg-white px-4 py-2 font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Kostenlos starten
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
        <div>
          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
            KI-Chat für deine PDFs
          </p>
          <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Frag deine PDFs, statt sie komplett zu lesen.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Lade ein Dokument hoch, stelle Fragen und bekomme klare Antworten aus dem Inhalt deiner PDF. Ideal für Lernunterlagen, Berichte, Verträge und lange Dokumente.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/login"
              className="rounded-2xl bg-white px-6 py-4 text-center font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Kostenlos testen
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/15 px-6 py-4 text-center font-semibold text-white transition hover:bg-white/10"
            >
              Dashboard öffnen
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">Free-Plan: 5 PDFs und 30 Fragen pro Tag.</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40">
          <div className="rounded-[1.5rem] bg-zinc-950 p-5">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-zinc-400">Tesla_Report_2026.pdf</p>
              <p className="mt-2 text-lg font-medium">Welche Kernaussagen enthält das Dokument?</p>
            </div>
            <div className="mt-4 rounded-2xl bg-white p-5 text-zinc-950">
              <p className="font-semibold">Antwort</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
                <li>• Tesla lieferte 620.000 Fahrzeuge aus.</li>
                <li>• Nordamerika war mit 310.000 Fahrzeugen der größte Markt.</li>
                <li>• Das Model Y war das meistverkaufte Modell.</li>
              </ul>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 p-4 text-sm text-zinc-400">
              Frage stellen: <span className="text-zinc-200">Was steht über Apple im Dokument?</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6">
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Anwendungsfälle</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">Für alle, die schnell aus Dokumenten lernen müssen.</h2>
            <p className="mt-5 leading-8 text-zinc-400">
              DocuMind ist bewusst einfach: Dokument hochladen, Frage stellen, Antwort bekommen. Keine komplizierte Einrichtung.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {useCases.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-zinc-300">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight">Starte kostenlos.</h2>
              <p className="mt-4 leading-8 text-zinc-400">
                Lade bis zu 5 PDFs hoch und stelle bis zu 30 Fragen pro Tag. Pro ist technisch vorbereitet und kommt später.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 text-zinc-950">
              <p className="text-sm font-medium text-zinc-500">Free</p>
              <p className="mt-2 text-4xl font-semibold">0 €</p>
              <p className="mt-3 text-zinc-600">Zum Testen und Validieren.</p>
              <Link
                href="/auth/login"
                className="mt-6 block rounded-2xl bg-zinc-950 px-5 py-3 text-center font-semibold text-white transition hover:bg-zinc-800"
              >
                Kostenlos starten
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
