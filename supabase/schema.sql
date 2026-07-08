-- AI PDF Chat MVP tables + Free/Pro usage limits
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  pages integer,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  questions_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;
alter table public.usage enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own documents" on public.documents;
create policy "Users can read own documents"
  on public.documents
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own documents" on public.documents;
create policy "Users can create own documents"
  on public.documents
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents"
  on public.documents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents"
  on public.documents
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own messages" on public.messages;
create policy "Users can read own messages"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.documents
      where documents.id = messages.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create messages for own documents" on public.messages;
create policy "Users can create messages for own documents"
  on public.messages
  for insert
  with check (
    exists (
      select 1
      from public.documents
      where documents.id = messages.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own usage" on public.usage;
create policy "Users can read own usage"
  on public.usage
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own usage" on public.usage;
create policy "Users can create own usage"
  on public.usage
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own usage" on public.usage;
create policy "Users can update own usage"
  on public.usage
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists documents_user_id_created_at_idx
  on public.documents(user_id, created_at desc);

create index if not exists messages_document_id_created_at_idx
  on public.messages(document_id, created_at asc);

create index if not exists usage_user_id_usage_date_idx
  on public.usage(user_id, usage_date desc);
