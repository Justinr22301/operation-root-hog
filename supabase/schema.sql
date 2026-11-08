-- Operation Root Hog: Supabase schema.
-- Paste into the Supabase SQL editor and run, then run seed.sql.
-- Phones never read tables directly. They call the functions at the bottom, which check
-- answers on the server. Only the broadcasts table is readable, so live messages can stream.

create extension if not exists pgcrypto with schema extensions;

-- ---------- tables ----------
create table if not exists game_settings (
  key   text primary key,
  value text not null
);
insert into game_settings (key, value) values ('salt', 'roothog-2026')
  on conflict (key) do update set value = excluded.value;

create table if not exists teams (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  name           text not null,
  level          text not null default 'agent' check (level in ('agent', 'senior')),
  agents         jsonb not null default '[]',
  route          text[] not null,
  lock_code      text not null,
  tracking       boolean not null default false,
  family_clue    text,
  family_answer  text,
  created_at     timestamptz not null default now()
);

create table if not exists family_facts (
  team_id uuid primary key references teams (id) on delete cascade,
  facts   jsonb not null default '{}'
);

create table if not exists answers (
  relay_id    text not null,
  kind        text not null check (kind in ('main', 'junior')),
  answer_norm text not null,
  primary key (relay_id, kind)
);

create table if not exists solves (
  team_id          uuid not null references teams (id) on delete cascade,
  relay_id         text not null,
  solved_at        timestamptz not null default now(),
  hints            int not null default 0,
  map_used         boolean not null default false,
  junior_first_try boolean not null default false,
  primary key (team_id, relay_id)
);

create table if not exists broadcasts (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  team_code   text,                       -- null means every team
  kind        text not null default 'message' check (kind in ('message', 'switch', 'family_clue')),
  sender      text not null default 'Operator Arco',
  voice       text not null default 'operator',
  body        text not null default '',
  payload     jsonb
);

create table if not exists locations (
  id        bigint generated always as identity primary key,
  team_id   uuid not null references teams (id) on delete cascade,
  lat       double precision not null,
  lng       double precision not null,
  accuracy  real,
  at        timestamptz not null default now()
);
create index if not exists locations_team_at on locations (team_id, at desc);

-- ---------- security: nothing is readable except broadcasts ----------
alter table game_settings enable row level security;
alter table teams         enable row level security;
alter table family_facts  enable row level security;
alter table answers       enable row level security;
alter table solves        enable row level security;
alter table broadcasts    enable row level security;
alter table locations     enable row level security;

revoke all on game_settings, teams, family_facts, answers, solves, broadcasts, locations from anon, authenticated;
grant select on broadcasts to anon, authenticated;
drop policy if exists "anyone can read broadcasts" on broadcasts;
create policy "anyone can read broadcasts" on broadcasts for select to anon, authenticated using (true);

-- Live messages stream to phones through Supabase Realtime.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'broadcasts') then
    alter publication supabase_realtime add table broadcasts;
  end if;
end $$;

-- ---------- helpers ----------
create or replace function normalize_answer(t text) returns text
language sql immutable as $$
  select regexp_replace(upper(coalesce(t, '')), '[^A-Z0-9]', '', 'g')
$$;

create or replace function answer_hash(t text) returns text
language sql stable security definer set search_path = public, extensions as $$
  select encode(extensions.digest((select value from game_settings where key = 'salt') || '|' || normalize_answer(t), 'sha256'), 'hex')
$$;

create or replace function relay_ids() returns text[]
language sql immutable as $$
  select array['sub', 'peace', 'courthouse', 'hill', 'press', 'river', 'island']
$$;

create or replace function arco_relay_ids() returns text[]
language sql immutable as $$
  select array['sub', 'peace', 'courthouse', 'hill', 'press', 'river']
$$;

create or replace function make_team_code() returns text
language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from teams where code = candidate);
  end loop;
  return candidate;
end $$;

-- What a phone is allowed to know about its own team.
create or replace function team_json(t teams) returns jsonb
language sql stable security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'code', t.code,
    'name', t.name,
    'level', t.level,
    'agents', t.agents,
    'route', to_jsonb(t.route),
    'tracking', t.tracking,
    'familyClue', t.family_clue,
    'familyHash', case when t.family_answer is null then null else answer_hash(t.family_answer) end,
    'solves', coalesce((
      select jsonb_object_agg(s.relay_id, jsonb_build_object('hints', s.hints, 'map', s.map_used, 'juniorFirstTry', s.junior_first_try))
      from solves s where s.team_id = t.id), '{}'::jsonb),
    'digits', left(t.lock_code, ((select count(*) from solves s where s.team_id = t.id) / 2)::int)
  )
$$;

-- ---------- functions the phones call ----------
create or replace function create_team(
  p_name text, p_level text, p_agents jsonb, p_facts jsonb, p_tracking boolean, p_route text[]
) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_route text[] := p_route;
  v_first text;
  v_team  teams;
begin
  if coalesce(trim(p_name), '') = '' or length(p_name) > 40 then
    raise exception 'Give your team a name of 40 letters or fewer.';
  end if;
  if jsonb_typeof(p_agents) <> 'array' or jsonb_array_length(p_agents) = 0 or jsonb_array_length(p_agents) > 15 then
    raise exception 'Add between 1 and 15 agents.';
  end if;

  -- Use the phone's shuffled route if it is a real one, otherwise shuffle here.
  if v_route is null or cardinality(v_route) <> cardinality(relay_ids())
     or not (v_route @> relay_ids() and v_route <@ relay_ids()) then
    select array_agg(r order by random()) into v_route from unnest(arco_relay_ids()) r;
    v_route := case when random() < 0.5 then array['island'] || v_route else v_route || array['island'] end;
  end if;

  -- Spread starting stops: a route that starts in Arco begins at the least-used Arco stop.
  if v_route[1] <> 'island' then
    select r into v_first
    from unnest(arco_relay_ids()) r
    left join (select route[1] as first_stop, count(*) as n from teams group by 1) used on used.first_stop = r
    order by coalesce(used.n, 0), random()
    limit 1;
    v_route := array[v_first] || array_remove(v_route, v_first);
  end if;

  insert into teams (code, name, level, agents, route, lock_code, tracking)
  values (
    make_team_code(),
    trim(p_name),
    case when p_level = 'senior' then 'senior' else 'agent' end,
    p_agents,
    v_route,
    lpad(floor(random() * 10000)::int::text, 4, '0'),
    coalesce(p_tracking, false)
  )
  returning * into v_team;

  insert into family_facts (team_id, facts) values (v_team.id, coalesce(p_facts, '{}'::jsonb));
  return team_json(v_team);
end $$;

create or replace function join_team(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare v_team teams;
begin
  select * into v_team from teams where code = upper(trim(p_code));
  if not found then
    raise exception 'No team uses that code. Check the code on the first phone and try again.';
  end if;
  return team_json(v_team);
end $$;

create or replace function record_solve(
  p_code text, p_relay text, p_main text, p_junior text, p_hints int, p_map boolean, p_junior_first_try boolean
) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_team teams;
  v_ok boolean;
  v_junior_ok boolean := coalesce(p_junior_first_try, false);
  v_count int;
begin
  select * into v_team from teams where code = upper(trim(p_code));
  if not found then raise exception 'Team not found.'; end if;
  if not (p_relay = 'family' or p_relay = any (relay_ids())) then raise exception 'Unknown relay.'; end if;

  if p_relay = 'family' then
    if v_team.family_answer is null then raise exception 'Your Family Relay clue is not ready yet.'; end if;
    v_ok := normalize_answer(p_main) = normalize_answer(v_team.family_answer);
  else
    v_ok := exists (select 1 from answers a where a.relay_id = p_relay and a.kind = 'main' and a.answer_norm = normalize_answer(p_main));
  end if;
  if not v_ok then raise exception 'That answer does not restore the relay.'; end if;

  -- Junior answers with a fixed answer are checked again here; open ones are taken as given.
  if exists (select 1 from answers a where a.relay_id = p_relay and a.kind = 'junior')
     and not exists (select 1 from answers a where a.relay_id = p_relay and a.kind = 'junior' and a.answer_norm = normalize_answer(p_junior)) then
    v_junior_ok := false;
  end if;

  insert into solves (team_id, relay_id, hints, map_used, junior_first_try)
  values (v_team.id, p_relay, greatest(coalesce(p_hints, 0), 0), coalesce(p_map, false), v_junior_ok)
  on conflict (team_id, relay_id) do nothing;

  select count(*) into v_count from solves where team_id = v_team.id;
  return jsonb_build_object('digits', left(v_team.lock_code, v_count / 2), 'restored', v_count);
end $$;

create or replace function post_location(p_code text, p_lat double precision, p_lng double precision, p_accuracy real)
returns void
language plpgsql volatile security definer set search_path = public, extensions as $$
declare v_team teams;
begin
  select * into v_team from teams where code = upper(trim(p_code));
  if not found or not v_team.tracking then return; end if;
  insert into locations (team_id, lat, lng, accuracy) values (v_team.id, p_lat, p_lng, p_accuracy);
end $$;

-- ---------- game master tools (run from the SQL editor, never from phones) ----------

-- Sets a family's clue and answer, and pushes the clue to their phones.
create or replace function set_family_clue(p_code text, p_clue text, p_answer text) returns void
language plpgsql volatile security definer set search_path = public, extensions as $$
declare v_team teams;
begin
  update teams set family_clue = p_clue, family_answer = normalize_answer(p_answer)
  where code = upper(trim(p_code)) returning * into v_team;
  if not found then raise exception 'No team with code %', p_code; end if;
  insert into broadcasts (team_code, kind, sender, voice, body, payload)
  values (v_team.code, 'family_clue', 'Operator Arco', 'operator', 'Your Family Relay clue just came in. It unlocks after three relays.',
          jsonb_build_object('text', p_clue, 'hash', answer_hash(p_answer)));
end $$;

-- Sends a live message. Leave p_team_code null to reach every family.
create or replace function send_broadcast(p_body text, p_sender text default 'Operator Arco', p_voice text default 'operator', p_team_code text default null)
returns void
language sql volatile security definer set search_path = public, extensions as $$
  insert into broadcasts (team_code, kind, sender, voice, body) values (upper(p_team_code), 'message', p_sender, p_voice, p_body)
$$;

-- Ends the game on every phone.
create or replace function throw_master_switch() returns void
language sql volatile security definer set search_path = public, extensions as $$
  insert into broadcasts (kind, sender, voice, body) values ('switch', 'Operator Arco', 'operator', 'Master switch thrown.')
$$;

-- One row per family: progress, score, padlock code, last known location.
create or replace view gm_overview as
select
  t.name,
  t.code,
  t.lock_code,
  t.level,
  jsonb_array_length(t.agents) as agents,
  (select count(*) from solves s where s.team_id = t.id) as relays_restored,
  (select coalesce(sum(100 - 25 * s.hints - case when s.map_used then 25 else 0 end + case when s.junior_first_try then 25 else 0 end), 0)
     from solves s where s.team_id = t.id) as score,
  (select max(s.solved_at) from solves s where s.team_id = t.id) as last_solve,
  t.route,
  t.family_clue is not null as family_clue_set,
  (select format('%s, %s', l.lat, l.lng) from locations l where l.team_id = t.id order by l.at desc limit 1) as last_location,
  (select l.at from locations l where l.team_id = t.id order by l.at desc limit 1) as last_location_at
from teams t
order by relays_restored desc, score desc;
revoke all on gm_overview from anon, authenticated;

-- After the game: deletes locations and sign-up answers.
create or replace function end_of_game_cleanup() returns void
language sql volatile security definer set search_path = public as $$
  delete from locations;
  delete from family_facts;
$$;

-- ---------- game master console (app/gm.html) ----------
-- The console signs in with a Supabase Auth email and password. Only emails in gm_allowlist get through.
-- Add yourself once in the SQL editor (keep the email out of this public file):
--   insert into gm_allowlist (email) values ('you@example.com');
create table if not exists gm_allowlist (
  email text primary key check (email = lower(email))
);
alter table gm_allowlist enable row level security;
revoke all on gm_allowlist from anon, authenticated;

create or replace function gm_require() returns void
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from gm_allowlist where email = lower(coalesce(auth.jwt() ->> 'email', ''))) then
    raise exception 'This account is not a game master.';
  end if;
end $$;

-- Everything the console shows, in one call.
create or replace function gm_state() returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  perform gm_require();
  return jsonb_build_object(
    'now', now(),
    'teams', coalesce((
      select jsonb_agg(x.j order by x.restored desc, x.score desc, x.name)
      from (
        select
          t.name,
          (select count(*) from solves s where s.team_id = t.id) as restored,
          (select coalesce(sum(100 - 25 * s.hints - case when s.map_used then 25 else 0 end + case when s.junior_first_try then 25 else 0 end), 0)
             from solves s where s.team_id = t.id) as score,
          jsonb_build_object(
            'code', t.code,
            'name', t.name,
            'level', t.level,
            'agents', t.agents,
            'route', to_jsonb(t.route),
            'lockCode', t.lock_code,
            'tracking', t.tracking,
            'familyClue', t.family_clue,
            'familyAnswer', t.family_answer,
            'facts', coalesce((select f.facts from family_facts f where f.team_id = t.id), '{}'::jsonb),
            'createdAt', t.created_at,
            'restored', (select count(*) from solves s where s.team_id = t.id),
            'score', (select coalesce(sum(100 - 25 * s.hints - case when s.map_used then 25 else 0 end + case when s.junior_first_try then 25 else 0 end), 0)
                        from solves s where s.team_id = t.id),
            'solves', coalesce((
              select jsonb_object_agg(s.relay_id, jsonb_build_object('at', s.solved_at, 'hints', s.hints, 'map', s.map_used, 'juniorFirstTry', s.junior_first_try))
              from solves s where s.team_id = t.id), '{}'::jsonb),
            'location', (
              select jsonb_build_object('lat', l.lat, 'lng', l.lng, 'accuracy', l.accuracy, 'at', l.at)
              from locations l where l.team_id = t.id order by l.at desc limit 1)
          ) as j
        from teams t
      ) x), '[]'::jsonb),
    'broadcasts', coalesce((
      select jsonb_agg(b order by b.id desc)
      from (select id, created_at, team_code, kind, sender, voice, body from broadcasts order by id desc limit 40) b), '[]'::jsonb)
  );
end $$;

create or replace function gm_set_family_clue(p_code text, p_clue text, p_answer text) returns void
language plpgsql volatile security definer set search_path = public, extensions as $$
begin
  perform gm_require();
  if coalesce(trim(p_clue), '') = '' or normalize_answer(p_answer) = '' then
    raise exception 'Write both the clue and its answer.';
  end if;
  perform set_family_clue(p_code, trim(p_clue), p_answer);
end $$;

create or replace function gm_send_broadcast(p_body text, p_sender text, p_voice text, p_team_code text default null) returns void
language plpgsql volatile security definer set search_path = public, extensions as $$
begin
  perform gm_require();
  if coalesce(trim(p_body), '') = '' then raise exception 'Write a message first.'; end if;
  if p_voice not in ('operator', 'badguys', 'gobbles', 'junior') then raise exception 'Unknown voice.'; end if;
  if p_team_code is not null and not exists (select 1 from teams where code = upper(trim(p_team_code))) then
    raise exception 'No team with code %', p_team_code;
  end if;
  perform send_broadcast(trim(p_body), coalesce(nullif(trim(p_sender), ''), 'Operator Arco'), p_voice, nullif(upper(trim(p_team_code)), ''));
end $$;

create or replace function gm_throw_master_switch() returns void
language plpgsql volatile security definer set search_path = public, extensions as $$
begin
  perform gm_require();
  perform throw_master_switch();
end $$;

-- Phones may call only these four.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function create_team(text, text, jsonb, jsonb, boolean, text[]) to anon, authenticated;
grant execute on function join_team(text) to anon, authenticated;
grant execute on function record_solve(text, text, text, text, int, boolean, boolean) to anon, authenticated;
grant execute on function post_location(text, double precision, double precision, real) to anon, authenticated;

-- The console's functions: signed-in accounts only, and each one checks gm_allowlist.
grant execute on function gm_state() to authenticated;
grant execute on function gm_set_family_clue(text, text, text) to authenticated;
grant execute on function gm_send_broadcast(text, text, text, text) to authenticated;
grant execute on function gm_throw_master_switch() to authenticated;
