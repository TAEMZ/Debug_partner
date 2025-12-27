-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create problems table
create table public.problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  environment_info jsonb default '{}'::jsonb,
  max_budget decimal(10,2) default 10.00,
  status text default 'active' check (status in ('active', 'resolved', 'paused')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create problem files table
create table public.problem_files (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid references public.problems(id) on delete cascade not null,
  file_url text not null,
  file_type text not null,
  created_at timestamptz default now() not null
);

-- Create reasoning sessions table
create table public.reasoning_sessions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid references public.problems(id) on delete cascade not null,
  layer_name text not null,
  layer_order integer not null,
  schedule_time timestamptz not null,
  completed_at timestamptz,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz default now() not null
);

-- Create insights table
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.reasoning_sessions(id) on delete cascade not null,
  problem_id uuid references public.problems(id) on delete cascade not null,
  content text not null,
  insight_type text not null check (insight_type in ('quick_fix', 'debugging_path', 'architectural', 'refactor', 'redesign')),
  code_samples jsonb default '[]'::jsonb,
  is_significant boolean default false,
  created_at timestamptz default now() not null
);

-- Create notification preferences table
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schedule_type text default 'smart' check (schedule_type in ('immediate', 'hourly', 'daily', 'smart')),
  max_notifications_per_day integer default 5,
  enabled boolean default true,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.problems enable row level security;
alter table public.problem_files enable row level security;
alter table public.reasoning_sessions enable row level security;
alter table public.insights enable row level security;
alter table public.notification_preferences enable row level security;

-- RLS Policies for problems
create policy "Users can view their own problems"
  on public.problems for select
  using (auth.uid() = user_id);

create policy "Users can create their own problems"
  on public.problems for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own problems"
  on public.problems for update
  using (auth.uid() = user_id);

create policy "Users can delete their own problems"
  on public.problems for delete
  using (auth.uid() = user_id);

-- RLS Policies for problem_files
create policy "Users can view files for their problems"
  on public.problem_files for select
  using (exists (
    select 1 from public.problems
    where problems.id = problem_files.problem_id
    and problems.user_id = auth.uid()
  ));

create policy "Users can create files for their problems"
  on public.problem_files for insert
  with check (exists (
    select 1 from public.problems
    where problems.id = problem_files.problem_id
    and problems.user_id = auth.uid()
  ));

-- RLS Policies for reasoning_sessions
create policy "Users can view sessions for their problems"
  on public.reasoning_sessions for select
  using (exists (
    select 1 from public.problems
    where problems.id = reasoning_sessions.problem_id
    and problems.user_id = auth.uid()
  ));

create policy "System can create sessions"
  on public.reasoning_sessions for insert
  with check (true);

create policy "System can update sessions"
  on public.reasoning_sessions for update
  using (true);

-- RLS Policies for insights
create policy "Users can view insights for their problems"
  on public.insights for select
  using (exists (
    select 1 from public.problems
    where problems.id = insights.problem_id
    and problems.user_id = auth.uid()
  ));

create policy "System can create insights"
  on public.insights for insert
  with check (true);

-- RLS Policies for notification_preferences
create policy "Users can view their own preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for problems table
create trigger handle_problems_updated_at
  before update on public.problems
  for each row
  execute function public.handle_updated_at();