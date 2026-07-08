import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col justify-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">AI PDF Chat</p>
        <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Frag deine PDFs, statt sie komplett zu lesen.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          MVP-Starter mit Next.js und Supabase Auth. Login, Registrierung, geschütztes Dashboard und Logout sind vorbereitet.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth/login"
            className="rounded-xl bg-white px-5 py-3 text-center font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Login / Registrierung
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/15 px-5 py-3 text-center font-medium text-white transition hover:bg-white/10"
          >
            Dashboard öffnen
          </Link>
        </div>
      </div>
    </main>
  );
}
