import Link from "next/link";
import { signIn, signUp } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message = params?.message;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Zur Startseite
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-zinc-400">AI PDF Chat</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Einloggen oder registrieren</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Nutze dieselbe Maske für Login und Registrierung. Für den MVP reicht E-Mail + Passwort.
          </p>
        </div>

        <form className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-300">E-Mail</span>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 focus:border-white"
              placeholder="du@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-300">Passwort</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 focus:border-white"
              placeholder="Mindestens 6 Zeichen"
            />
          </label>

          {message ? (
            <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {message}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              formAction={signIn}
              className="rounded-xl bg-white px-4 py-3 font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Einloggen
            </button>
            <button
              formAction={signUp}
              className="rounded-xl border border-white/15 px-4 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Registrieren
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
