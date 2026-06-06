-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  total_score integer default 0,
  wins integer default 0,
  participations integer default 0,
  streak integer default 0,
  last_active date,
  is_admin boolean default false,
  is_suspended boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CAMPAIGNS
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  is_locked boolean default false,
  timezone text default 'Africa/Conakry',
  open_hour integer default 20,
  close_hour integer default 2,
  created_at timestamptz default now()
);

-- CHALLENGE DAYS
create table public.challenge_days (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns on delete cascade,
  day_number integer not null,
  challenge_type text not null,
  title text not null,
  description text,
  rules jsonb default '{}',
  max_votes_per_user integer default 6,
  points_winner integer default 100,
  points_participant integer default 20,
  points_voter integer default 5,
  is_locked boolean default false,
  status text default 'pending',
  created_at timestamptz default now()
);

-- SUBMISSIONS
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  challenge_day_id uuid references public.challenge_days on delete cascade,
  file_url text,
  content text,
  team text,
  tap_count integer default 0,
  hold_duration_ms integer default 0,
  vote_count integer default 0,
  is_winner boolean default false,
  is_moderated boolean default false,
  rank integer,
  points_earned integer default 0,
  created_at timestamptz default now(),
  unique(user_id, challenge_day_id)
);

-- VOTES
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references public.profiles on delete cascade,
  submission_id uuid references public.submissions on delete cascade,
  challenge_day_id uuid references public.challenge_days on delete cascade,
  created_at timestamptz default now(),
  unique(voter_id, submission_id)
);

-- SCORES
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  challenge_day_id uuid references public.challenge_days on delete cascade,
  points integer not null,
  reason text,
  created_at timestamptz default now(),
  unique(user_id, challenge_day_id)
);

-- REWARDS
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  challenge_day_id uuid references public.challenge_days,
  type text not null,
  label text not null,
  icon text,
  created_at timestamptz default now()
);

-- AUTO CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.votes enable row level security;
alter table public.scores enable row level security;
alter table public.rewards enable row level security;
alter table public.challenge_days enable row level security;
alter table public.campaigns enable row level security;

-- POLICIES
create policy "Profiles visibles par tous"
  on public.profiles for select using (true);

create policy "Modifier son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Submissions visibles"
  on public.submissions for select using (true);

create policy "Creer sa submission"
  on public.submissions for insert
  with check (auth.uid() = user_id);

create policy "Modifier sa submission"
  on public.submissions for update
  using (auth.uid() = user_id);

create policy "Votes visibles"
  on public.votes for select using (true);

create policy "Voter une fois"
  on public.votes for insert
  with check (auth.uid() = voter_id);

create policy "Scores visibles"
  on public.scores for select using (true);

create policy "Challenge days visibles"
  on public.challenge_days for select using (true);

create policy "Campaigns visibles"
  on public.campaigns for select using (true);

create policy "Rewards visibles"
  on public.rewards for select using (true);
