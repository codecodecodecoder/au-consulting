-- ════════════════════════════════════════════════════════════════════════════
-- Investor Portal — access control schema
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tables ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    email       text not null,
    full_name   text,
    username    text unique,
    status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
    is_admin    boolean not null default false,
    created_at  timestamptz not null default now(),
    approved_at timestamptz,
    approved_by uuid references auth.users(id)
);

create table if not exists public.user_funds (
    user_id   uuid not null references auth.users(id) on delete cascade,
    fund_name text not null,
    unique (user_id, fund_name)
);

-- ── Helper: is the caller an approved admin? ───────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and is_admin and status = 'approved'
    );
$$;

-- ── New sign-ups start as "pending" ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, lower(new.email), new.raw_user_meta_data ->> 'full_name')
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Users that already exist (provisioned earlier by the admin script) are
-- treated as approved; their existing user_funds rows are kept.
insert into public.profiles (id, email, status, approved_at)
select id, lower(email), 'approved', now() from auth.users
on conflict (id) do nothing;

-- ── Username → email lookup (lets the admin sign in as "admin123") ─────────
create or replace function public.email_for_username(p_username text)
returns text
language sql stable security definer set search_path = public
as $$
    select email from public.profiles
    where username is not null and lower(username) = lower(trim(p_username))
    limit 1;
$$;

-- ── Admin action: approve / reject / change fund access in one step ───────
create or replace function public.admin_set_access(
    p_user   uuid,
    p_status text,
    p_funds  text[]
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Only an admin can change access';
    end if;
    if p_status not in ('pending', 'approved', 'rejected') then
        raise exception 'Invalid status %', p_status;
    end if;
    if p_user = auth.uid() and p_status <> 'approved' then
        raise exception 'You cannot revoke your own access';
    end if;

    update public.profiles
       set status      = p_status,
           approved_at = case when p_status = 'approved' then coalesce(approved_at, now()) else null end,
           approved_by = case when p_status = 'approved' then auth.uid() else null end
     where id = p_user;

    delete from public.user_funds where user_id = p_user;

    if p_status = 'approved' and p_funds is not null then
        insert into public.user_funds (user_id, fund_name)
        select p_user, f from unnest(p_funds) as f
        on conflict do nothing;
    end if;
end;
$$;

-- ── Row-level security ─────────────────────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.user_funds enable row level security;

-- Clear any older policies so nothing permissive is left behind.
do $$
declare p record;
begin
    for p in
        select policyname, tablename from pg_policies
        where schemaname = 'public' and tablename in ('profiles', 'user_funds')
    loop
        execute format('drop policy %I on public.%I', p.policyname, p.tablename);
    end loop;
end $$;

-- profiles: you see your own row; admins see and manage everyone.
create policy "profiles: read own or admin"
    on public.profiles for select
    using (id = auth.uid() or public.is_admin());

create policy "profiles: admin update"
    on public.profiles for update
    using (public.is_admin()) with check (public.is_admin());

create policy "profiles: admin delete"
    on public.profiles for delete
    using (public.is_admin());

-- user_funds: approved users see their own funds; admins manage all.
create policy "user_funds: read own when approved, or admin"
    on public.user_funds for select
    using (
        public.is_admin()
        or (
            user_id = auth.uid()
            and exists (select 1 from public.profiles
                        where id = auth.uid() and status = 'approved')
        )
    );

create policy "user_funds: admin write"
    on public.user_funds for all
    using (public.is_admin()) with check (public.is_admin());

-- ── Grants ─────────────────────────────────────────────────────────────────
revoke all on function public.admin_set_access(uuid, text, text[]) from public, anon;
grant execute on function public.admin_set_access(uuid, text, text[]) to authenticated;
grant execute on function public.email_for_username(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
