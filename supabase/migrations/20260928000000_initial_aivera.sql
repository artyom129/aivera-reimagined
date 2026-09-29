-- AIvera: clean Supabase bootstrap
-- Apply once to a NEW Supabase project via SQL Editor or Supabase CLI.
-- No legacy project identifiers or secrets are required.

create extension if not exists "pgcrypto";
create schema if not exists private;

do $$
begin
  create type public.user_role as enum ('teacher', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_tier as enum ('free', 'basic', 'premium');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.app_language as enum ('ru', 'kk', 'en');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_mode as enum ('default', 'lesson_plan', 'tests', 'feedback');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_role as enum ('user', 'assistant');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text check (full_name is null or char_length(full_name) <= 200),
  role public.user_role not null default 'teacher',
  subscription_tier public.subscription_tier not null default 'free',
  language public.app_language not null default 'ru',
  token_limit integer not null default 100000 check (token_limit >= 0),
  tokens_used integer not null default 0 check (tokens_used >= 0),
  is_blocked boolean not null default false,
  blocked_reason text check (blocked_reason is null or char_length(blocked_reason) <= 500),
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  title text not null default 'Новый чат' check (char_length(title) between 1 and 200),
  ai_mode public.ai_mode not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role public.message_role not null,
  content text not null check (char_length(content) between 1 and 200000),
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  content text not null check (char_length(content) between 1 and 50000),
  variables jsonb not null default '[]'::jsonb check (jsonb_typeof(variables) = 'array'),
  category text check (category is null or char_length(category) <= 100),
  is_public boolean not null default false,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  model text not null check (char_length(model) between 1 and 100),
  tokens_used integer not null check (tokens_used > 0),
  cost numeric(12, 6) check (cost is null or cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users(id) on delete cascade,
  action text not null check (char_length(action) between 1 and 100),
  target_type text check (target_type is null or char_length(target_type) <= 100),
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_request_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key check (char_length(key) between 1 and 100),
  value jsonb not null,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_folders_user_updated on public.folders(user_id, updated_at desc);
create index if not exists idx_chats_user_updated on public.chats(user_id, updated_at desc);
create index if not exists idx_chats_folder_updated on public.chats(folder_id, updated_at desc);
create index if not exists idx_messages_chat_created on public.messages(chat_id, created_at);
create index if not exists idx_templates_user_created on public.templates(user_id, created_at desc);
create index if not exists idx_templates_public_usage on public.templates(is_public, usage_count desc) where is_public;
create index if not exists idx_usage_logs_user_created on public.usage_logs(user_id, created_at desc);
create index if not exists idx_audit_logs_admin_created on public.audit_logs(admin_id, created_at desc);
create index if not exists idx_ai_request_user_created on public.ai_request_log(user_id, created_at desc);

insert into public.app_settings (key, value)
values ('default_ai_model', '"gemini-3.5-flash-lite"'::jsonb)
on conflict (key) do nothing;

alter table public.users enable row level security;
alter table public.folders enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.templates enable row level security;
alter table public.usage_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_request_log enable row level security;
alter table public.app_settings enable row level security;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke create on schema public from public;
grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.users from anon, authenticated;
revoke all on table public.folders from anon, authenticated;
revoke all on table public.chats from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on table public.templates from anon, authenticated;
revoke all on table public.usage_logs from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on table public.ai_request_log from anon, authenticated;
revoke all on table public.app_settings from anon, authenticated;

grant select, update on table public.users to authenticated;
grant select, insert, update, delete on table public.folders to authenticated;
grant select, insert, update, delete on table public.chats to authenticated;
grant select, insert, delete on table public.messages to authenticated;
grant select, insert, update, delete on table public.templates to authenticated;
grant select on table public.usage_logs to authenticated;
grant select on table public.audit_logs to authenticated;
grant select, insert, update on table public.app_settings to authenticated;
grant all on table public.users, public.folders, public.chats, public.messages,
  public.templates, public.usage_logs, public.audit_logs, public.ai_request_log,
  public.app_settings to service_role;
grant usage, select on sequence public.ai_request_log_id_seq to service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users
    where id = (select auth.uid())
      and role = 'admin'::public.user_role
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create policy "users_select_own_or_admin"
on public.users for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));

create policy "users_update_own_or_admin"
on public.users for update to authenticated
using (id = (select auth.uid()) or (select private.is_admin()))
with check (id = (select auth.uid()) or (select private.is_admin()));

create policy "folders_select_own"
on public.folders for select to authenticated
using (user_id = (select auth.uid()));

create policy "folders_insert_own"
on public.folders for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "folders_update_own"
on public.folders for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "folders_delete_own"
on public.folders for delete to authenticated
using (user_id = (select auth.uid()));

create policy "chats_select_own"
on public.chats for select to authenticated
using (user_id = (select auth.uid()));

create policy "chats_insert_own"
on public.chats for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    folder_id is null
    or exists (
      select 1 from public.folders
      where folders.id = chats.folder_id
        and folders.user_id = (select auth.uid())
    )
  )
);

create policy "chats_update_own"
on public.chats for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    folder_id is null
    or exists (
      select 1 from public.folders
      where folders.id = chats.folder_id
        and folders.user_id = (select auth.uid())
    )
  )
);

create policy "chats_delete_own"
on public.chats for delete to authenticated
using (user_id = (select auth.uid()));

create policy "messages_select_via_owned_chat"
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.chats
    where chats.id = messages.chat_id
      and chats.user_id = (select auth.uid())
  )
);

create policy "messages_insert_via_owned_chat"
on public.messages for insert to authenticated
with check (
  exists (
    select 1 from public.chats
    where chats.id = messages.chat_id
      and chats.user_id = (select auth.uid())
  )
);

create policy "messages_delete_via_owned_chat"
on public.messages for delete to authenticated
using (
  exists (
    select 1 from public.chats
    where chats.id = messages.chat_id
      and chats.user_id = (select auth.uid())
  )
);

create policy "templates_select_visible"
on public.templates for select to authenticated
using (
  is_public
  or user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy "templates_insert_own_or_admin"
on public.templates for insert to authenticated
with check (
  user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy "templates_update_own_or_admin"
on public.templates for update to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_admin())
)
with check (
  user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy "templates_delete_own_or_admin"
on public.templates for delete to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy "usage_logs_select_own_or_admin"
on public.usage_logs for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy "audit_logs_select_admin"
on public.audit_logs for select to authenticated
using ((select private.is_admin()));

create policy "app_settings_select_authenticated"
on public.app_settings for select to authenticated
using (true);

create policy "app_settings_insert_admin"
on public.app_settings for insert to authenticated
with check ((select private.is_admin()));

create policy "app_settings_update_admin"
on public.app_settings for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, role, language)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@local.invalid'),
    left(nullif(new.raw_user_meta_data ->> 'full_name', ''), 200),
    'teacher'::public.user_role,
    case
      when new.raw_user_meta_data ->> 'language' in ('ru', 'kk', 'en')
        then (new.raw_user_meta_data ->> 'language')::public.app_language
      else 'ru'::public.app_language
    end
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.users.full_name, excluded.full_name);
  return new;
end;
$$;

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
  set email = coalesce(new.email, new.id::text || '@local.invalid')
  where id = new.id;
  return new;
end;
$$;

create or replace function public.protect_user_privileged_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id = old.id;
  new.created_at = old.created_at;

  if (select auth.uid()) is not null then
    new.email = old.email;
  end if;

  if current_user = 'authenticated'
     and (select auth.uid()) = old.id
     and not (select private.is_admin()) then
    new.role = old.role;
    new.subscription_tier = old.subscription_tier;
    new.token_limit = old.token_limit;
    new.tokens_used = old.tokens_used;
    new.is_blocked = old.is_blocked;
    new.blocked_reason = old.blocked_reason;
    new.last_login = old.last_login;
  end if;

  return new;
end;
$$;

create or replace function public.touch_chat_on_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end;
$$;

create or replace function public.claim_ai_request(p_limit integer default 12)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  request_count integer;
  profile public.users%rowtype;
begin
  if current_user_id is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select * into profile
  from public.users
  where id = current_user_id;

  if not found or profile.is_blocked then
    return false;
  end if;

  if profile.token_limit > 0 and profile.tokens_used >= profile.token_limit then
    return false;
  end if;

  delete from public.ai_request_log
  where user_id = current_user_id
    and created_at < now() - interval '1 day';

  select count(*) into request_count
  from public.ai_request_log
  where user_id = current_user_id
    and created_at >= now() - interval '1 minute';

  if request_count >= greatest(1, least(coalesce(p_limit, 12), 60)) then
    return false;
  end if;

  insert into public.ai_request_log (user_id) values (current_user_id);
  return true;
end;
$$;

create or replace function public.record_ai_usage(p_model text, p_tokens integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  safe_tokens integer := greatest(1, least(coalesce(p_tokens, 0), 1000000));
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.users
  set tokens_used = tokens_used + safe_tokens
  where id = current_user_id
    and not is_blocked;

  if not found then
    raise exception 'Profile unavailable';
  end if;

  insert into public.usage_logs (user_id, model, tokens_used)
  values (current_user_id, left(coalesce(p_model, 'unknown'), 100), safe_tokens);
end;
$$;

create or replace function public.increment_template_usage(p_template_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_count integer;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.templates
  set usage_count = usage_count + 1
  where id = p_template_id
    and (
      is_public
      or user_id = current_user_id
      or (select private.is_admin())
    )
  returning usage_count into new_count;

  if new_count is null then
    raise exception 'Template not found or forbidden';
  end if;

  return new_count;
end;
$$;

create or replace function public.record_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.users
  set last_login = now()
  where id = current_user_id;
end;
$$;

create or replace function public.log_admin_action(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Forbidden';
  end if;

  insert into public.audit_logs (admin_id, action, target_type, target_id, details)
  values (
    (select auth.uid()),
    left(p_action, 100),
    left(p_target_type, 100),
    p_target_id,
    coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

create or replace function public.get_admin_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  usage_history jsonb;
  result jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'Forbidden';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'tokens_used', u.tokens_used,
        'cost', u.cost,
        'created_at', u.created_at
      )
      order by u.created_at
    ),
    '[]'::jsonb
  )
  into usage_history
  from public.usage_logs u
  where u.created_at >= now() - interval '30 days';

  select jsonb_build_object(
    'totalUsers', (select count(*) from public.users),
    'activeUsers', (
      select count(*) from public.users
      where last_login >= now() - interval '7 days'
    ),
    'blockedUsers', (
      select count(*) from public.users
      where is_blocked
    ),
    'totalChats', (select count(*) from public.chats),
    'totalMessages', (select count(*) from public.messages),
    'totalTokens', (
      select coalesce(sum(tokens_used), 0)
      from public.usage_logs
      where created_at >= now() - interval '30 days'
    ),
    'totalCost', (
      select coalesce(sum(cost), 0)
      from public.usage_logs
      where created_at >= now() - interval '30 days'
    ),
    'usageHistory', usage_history
  )
  into result;

  return result;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.sync_user_email() from public;
revoke all on function public.protect_user_privileged_fields() from public;
revoke all on function public.touch_chat_on_message() from public;
revoke all on function public.claim_ai_request(integer) from public;
revoke all on function public.record_ai_usage(text, integer) from public;
revoke all on function public.increment_template_usage(uuid) from public;
revoke all on function public.record_login() from public;
revoke all on function public.log_admin_action(text, text, uuid, jsonb) from public;
revoke all on function public.get_admin_analytics() from public;

grant execute on function public.claim_ai_request(integer) to authenticated;
grant execute on function public.record_ai_usage(text, integer) to authenticated;
grant execute on function public.increment_template_usage(uuid) to authenticated;
grant execute on function public.record_login() to authenticated;
grant execute on function public.log_admin_action(text, text, uuid, jsonb) to authenticated;
grant execute on function public.get_admin_analytics() to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_user_email();

drop trigger if exists protect_user_privileged_fields on public.users;
create trigger protect_user_privileged_fields
before update on public.users
for each row execute function public.protect_user_privileged_fields();

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists folders_updated_at on public.folders;
create trigger folders_updated_at
before update on public.folders
for each row execute function public.set_updated_at();

drop trigger if exists chats_updated_at on public.chats;
create trigger chats_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

drop trigger if exists templates_updated_at on public.templates;
create trigger templates_updated_at
before update on public.templates
for each row execute function public.set_updated_at();

drop trigger if exists messages_touch_chat on public.messages;
create trigger messages_touch_chat
after insert on public.messages
for each row execute function public.touch_chat_on_message();

-- Safe backfill if this migration is applied after test users were created.
insert into public.users (id, email, full_name, role, language)
select
  u.id,
  coalesce(u.email, u.id::text || '@local.invalid'),
  left(nullif(u.raw_user_meta_data ->> 'full_name', ''), 200),
  'teacher'::public.user_role,
  case
    when u.raw_user_meta_data ->> 'language' in ('ru', 'kk', 'en')
      then (u.raw_user_meta_data ->> 'language')::public.app_language
    else 'ru'::public.app_language
  end
from auth.users u
on conflict (id) do nothing;

