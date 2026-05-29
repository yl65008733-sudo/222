create table if not exists public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 24),
  message text not null check (char_length(message) between 1 and 240),
  trip_id text,
  created_at timestamptz not null default now()
);

alter table public.guestbook_messages enable row level security;

drop policy if exists "Anyone can read guestbook messages" on public.guestbook_messages;
create policy "Anyone can read guestbook messages"
on public.guestbook_messages
for select
using (true);

drop policy if exists "Anyone can add guestbook messages" on public.guestbook_messages;
create policy "Anyone can add guestbook messages"
on public.guestbook_messages
for insert
with check (
  char_length(name) between 1 and 24
  and char_length(message) between 1 and 240
);
