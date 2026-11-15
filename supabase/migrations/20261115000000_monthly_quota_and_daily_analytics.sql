-- Monthly token quota and per-day analytics.
-- Apply after 20260928000000_initial_aivera.sql.
--
-- Before: tokens_used only ever grew, so a teacher who hit token_limit once
-- stayed locked out for good. Now the counter resets at the start of each
-- calendar month (UTC).

alter table public.users
  add column if not exists usage_period_start date not null default (date_trunc('month', now()))::date;

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
    new.usage_period_start = old.usage_period_start;
    new.is_blocked = old.is_blocked;
    new.blocked_reason = old.blocked_reason;
    new.last_login = old.last_login;
  end if;

  return new;
end;
$$;

-- Returns 'ok', 'rate_limited', 'quota_exceeded' or 'blocked' so the API can
-- tell the user what actually happened.
drop function if exists public.claim_ai_request(integer);

create function public.claim_ai_request(p_limit integer default 12)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  this_month date := (date_trunc('month', now()))::date;
  request_count integer;
  profile public.users%rowtype;
begin
  if current_user_id is null then
    return 'blocked';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  update public.users
  set tokens_used = 0,
      usage_period_start = this_month
  where id = current_user_id
    and usage_period_start < this_month;

  select * into profile from public.users where id = current_user_id;

  if not found or profile.is_blocked then
    return 'blocked';
  end if;

  if profile.token_limit > 0 and profile.tokens_used >= profile.token_limit then
    return 'quota_exceeded';
  end if;

  delete from public.ai_request_log
  where user_id = current_user_id
    and created_at < now() - interval '1 day';

  select count(*) into request_count
  from public.ai_request_log
  where user_id = current_user_id
    and created_at >= now() - interval '1 minute';

  if request_count >= greatest(1, least(coalesce(p_limit, 12), 60)) then
    return 'rate_limited';
  end if;

  insert into public.ai_request_log (user_id) values (current_user_id);
  return 'ok';
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
  this_month date := (date_trunc('month', now()))::date;
  safe_tokens integer := greatest(1, least(coalesce(p_tokens, 0), 1000000));
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.users
  set tokens_used = case when usage_period_start < this_month then safe_tokens else tokens_used + safe_tokens end,
      usage_period_start = this_month
  where id = current_user_id;

  if not found then
    raise exception 'Profile unavailable';
  end if;

  insert into public.usage_logs (user_id, model, tokens_used)
  values (current_user_id, left(coalesce(p_model, 'unknown'), 100), safe_tokens);
end;
$$;

-- The old version returned every usage row for 30 days; the chart drew
-- thousands of points. Now: one row per day, including empty days.
create or replace function public.get_admin_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'Forbidden';
  end if;

  select jsonb_build_object(
    'totalUsers', (select count(*) from public.users),
    'activeUsers', (select count(*) from public.users where last_login >= now() - interval '7 days'),
    'blockedUsers', (select count(*) from public.users where is_blocked),
    'usersNearLimit', (
      select count(*) from public.users
      where token_limit > 0
        and usage_period_start = (date_trunc('month', now()))::date
        and tokens_used >= token_limit * 0.8
    ),
    'totalChats', (select count(*) from public.chats),
    'totalMessages', (select count(*) from public.messages),
    'tokens30d', (
      select coalesce(sum(tokens_used), 0) from public.usage_logs
      where created_at >= now() - interval '30 days'
    ),
    'requests30d', (
      select count(*) from public.usage_logs
      where created_at >= now() - interval '30 days'
    ),
    'usageByDay', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'tokens', d.tokens, 'requests', d.requests) order by d.day), '[]'::jsonb)
      from (
        select
          days.day::date as day,
          coalesce(sum(u.tokens_used), 0) as tokens,
          count(u.id) as requests
        from generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') as days(day)
        left join public.usage_logs u on u.created_at::date = days.day::date
        group by days.day
      ) d
    ),
    'usageByModel', (
      select coalesce(jsonb_agg(jsonb_build_object('model', m.model, 'tokens', m.tokens) order by m.tokens desc), '[]'::jsonb)
      from (
        select model, sum(tokens_used) as tokens
        from public.usage_logs
        where created_at >= now() - interval '30 days'
        group by model
      ) m
    )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.claim_ai_request(integer) from public;
grant execute on function public.claim_ai_request(integer) to authenticated;
revoke all on function public.record_ai_usage(text, integer) from public;
grant execute on function public.record_ai_usage(text, integer) to authenticated;
revoke all on function public.get_admin_analytics() from public;
grant execute on function public.get_admin_analytics() to authenticated;
