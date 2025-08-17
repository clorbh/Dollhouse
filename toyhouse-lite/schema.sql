
-- Perfis
create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text default '',
  avatar text default ''
);

-- Pastas
create table if not exists public.folders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Personagens
create table if not exists public.characters (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id text references public.folders(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text default '',
  tags text[] default '{}',
  images text[] default '{}',
  tradeable boolean default false,
  visibility text default 'public' check (visibility in ('public','private')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.touch_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_characters_updated_at on public.characters;
create trigger trg_characters_updated_at before update on public.characters for each row execute function public.touch_updated_at();

-- Comentários
create table if not exists public.comments (
  id text primary key,
  character_id text not null references public.characters(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Transferências
create table if not exists public.transfers (
  id text primary key,
  character_id text not null references public.characters(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz default now()
);

-- View de transferências
create or replace view public.transfers_view as
  select t.*, c.name as character_name
  from public.transfers t
  join public.characters c on c.id = t.character_id;

-- RLS
alter table public.users_profile enable row level security;
alter table public.folders enable row level security;
alter table public.characters enable row level security;
alter table public.comments enable row level security;
alter table public.transfers enable row level security;

-- Policies
create policy if not exists profiles_select_all on public.users_profile for select using (true);
create policy if not exists profiles_update_own on public.users_profile for update using (auth.uid() = id);
create policy if not exists profiles_insert_self on public.users_profile for insert with check (auth.uid() = id);

create policy if not exists folders_crud_owner on public.folders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists characters_read_public on public.characters for select using (visibility = 'public' or auth.uid() = user_id);
create policy if not exists characters_crud_owner on public.characters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists comments_read_all on public.comments for select using (true);
create policy if not exists comments_insert_authed on public.comments for insert with check (auth.uid() is not null);
create policy if not exists comments_delete_author_or_owner on public.comments for delete using (
  author_id = auth.uid() or exists(select 1 from characters c where c.id = character_id and c.user_id = auth.uid())
);

create policy if not exists transfers_crud_involved on public.transfers for all using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
) with check (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- Opcional: tabela de convites (não é usada pelo app por padrão, que valida no frontend)
create table if not exists public.invites (
  code text primary key,
  enabled boolean default true
);
insert into public.invites(code, enabled) values ('Y8KK1', true) on conflict (code) do nothing;
