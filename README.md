# AI PDF Chat

MVP mit:

- Next.js
- Supabase Auth
- Supabase Datenbank für gespeicherte PDFs und Chatverlauf
- PDF-Textauslesung im Browser
- Groq-kompatible KI-Anbindung über OpenAI SDK

## Lokal starten

```bash
npm install
npm run dev
```

Dann öffnen:

```text
http://localhost:3000
```

## .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-publishable-key
GROQ_API_KEY=gsk_dein_key
```

## Supabase Tabellen anlegen

In Supabase öffnen:

**SQL Editor -> New query**

Dann den Inhalt ausführen aus:

```text
supabase/schema.sql
```

Danach App neu starten:

```bash
npm run dev
```

## Test

1. Registrieren / einloggen
2. PDF hochladen
3. Frage stellen
4. Seite neu laden
5. Prüfen, ob Dokument links weiterhin erscheint
6. Dokument öffnen und prüfen, ob Chatverlauf erhalten ist
