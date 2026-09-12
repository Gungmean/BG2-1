create table if not exists public.classboard_records (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.classboard_records enable row level security;

drop policy if exists "classboard public read" on public.classboard_records;
drop policy if exists "classboard public insert" on public.classboard_records;
drop policy if exists "classboard public update" on public.classboard_records;
drop policy if exists "classboard public delete" on public.classboard_records;

create policy "classboard public read"
on public.classboard_records
for select
using (true);

create policy "classboard public insert"
on public.classboard_records
for insert
with check (collection in ('notices', 'suggestions', 'exam_plans'));

create policy "classboard public update"
on public.classboard_records
for update
using (collection in ('notices', 'suggestions', 'exam_plans'))
with check (collection in ('notices', 'suggestions', 'exam_plans'));

create policy "classboard public delete"
on public.classboard_records
for delete
using (collection in ('notices', 'suggestions', 'exam_plans'));

create index if not exists classboard_records_collection_updated_idx
on public.classboard_records (collection, updated_at desc);

alter publication supabase_realtime add table public.classboard_records;
