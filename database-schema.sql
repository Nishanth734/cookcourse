-- CourseCook Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  email varchar(255) unique not null,
  name varchar(255),
  password varchar(255) not null,
  role varchar(20) default 'USER' check (role in ('USER', 'ADMIN', 'MENTOR')),
  avatar varchar(500),
  bio text,
  college varchar(255),
  graduation_year integer,
  target_role varchar(255),
  target_companies text[] default '{}',
  skill_level varchar(20) default 'BEGINNER' check (skill_level in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  daily_study_hours decimal default 2.0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- User profiles
create table if not exists user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade unique,
  current_topic varchar(255),
  progress jsonb,
  weak_topics text[] default '{}',
  strong_topics text[] default '{}',
  readiness_scores jsonb,
  total_study_hours decimal default 0,
  consistency_streak integer default 0,
  badges text[] default '{}'
);

-- Roadmaps
create table if not exists roadmaps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  topic varchar(255) not null,
  skill_level varchar(20) not null,
  target_company varchar(255),
  target_timeline timestamp with time zone,
  phases jsonb not null,
  status varchar(20) default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED', 'PAUSED')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Phase progress
create table if not exists phase_progress (
  id uuid default uuid_generate_v4() primary key,
  roadmap_id uuid references roadmaps(id) on delete cascade,
  phase_name varchar(255) not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  subtopics jsonb
);

-- Resources
create table if not exists resources (
  id uuid default uuid_generate_v4() primary key,
  title varchar(500) not null,
  description text not null,
  type varchar(50) not null,
  topic varchar(255) not null,
  difficulty varchar(20) not null,
  platform varchar(255) not null,
  instructor varchar(255),
  duration varchar(100),
  rating decimal,
  price varchar(20) not null,
  language varchar(50) default 'English',
  url varchar(1000) not null,
  thumbnail varchar(1000),
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- User notes (must be created before bookmarks)
create table if not exists user_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  topic varchar(255) not null,
  title varchar(500) not null,
  content text not null,
  type varchar(50) not null,
  is_important boolean default false,
  revision_count integer default 0,
  last_revised timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Bookmarks (created after user_notes to avoid reference error)
create table if not exists bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  resource_id uuid references resources(id) on delete set null,
  note_id uuid references user_notes(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, resource_id),
  unique(user_id, note_id)
);

-- Quizzes
create table if not exists quizzes (
  id uuid default uuid_generate_v4() primary key,
  title varchar(500) not null,
  topic varchar(255) not null,
  difficulty varchar(20) not null,
  question_count integer not null,
  time_limit integer,
  questions jsonb not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Quiz attempts
create table if not exists quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete cascade,
  score decimal not null,
  answers jsonb not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()),
  time_taken integer
);

-- Coding problems
create table if not exists coding_problems (
  id uuid default uuid_generate_v4() primary key,
  title varchar(500) not null,
  topic varchar(255) not null,
  difficulty varchar(20) not null,
  description text not null,
  examples jsonb not null,
  constraints text not null,
  hints text[] default '{}',
  editorial text,
  test_cases jsonb not null,
  hidden_test_cases jsonb not null,
  company_tags text[] default '{}',
  acceptance_rate decimal,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Coding submissions
create table if not exists coding_submissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  problem_id uuid references coding_problems(id) on delete cascade,
  code text not null,
  language varchar(50) not null,
  status varchar(50) not null,
  runtime integer,
  memory integer,
  submitted_at timestamp with time zone default timezone('utc'::text, now())
);

-- Mock interviews
create table if not exists mock_interviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  type varchar(50) not null,
  topic varchar(255) not null,
  questions jsonb not null,
  responses jsonb,
  feedback jsonb,
  scores jsonb,
  status varchar(20) default 'COMPLETED',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Projects
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  title varchar(500) not null,
  description text not null,
  topic varchar(255) not null,
  difficulty varchar(20) not null,
  tech_stack text[] not null,
  features text[] not null,
  milestones jsonb not null,
  github_structure text,
  deployment_guide text,
  resume_value text,
  interview_points text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- User projects
create table if not exists user_projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  status varchar(20) default 'NOT_STARTED',
  github_url varchar(1000),
  deployed_url varchar(1000),
  ai_review jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Placement stories
create table if not exists placement_stories (
  id uuid default uuid_generate_v4() primary key,
  name varchar(255) not null,
  company varchar(255) not null,
  role varchar(255) not null,
  college varchar(255),
  background text,
  timeline varchar(100) not null,
  resources_used text[] default '{}',
  projects text[] default '{}',
  mistakes text[] default '{}',
  interview_exp text not null,
  tips text[] default '{}',
  image_url varchar(1000),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Resumes
create table if not exists resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  role varchar(255) not null,
  content jsonb not null,
  ats_score decimal,
  recruiter_score decimal,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Daily planner
create table if not exists daily_planner (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  date date not null,
  tasks jsonb not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Achievements
create table if not exists achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  badge varchar(100) not null,
  title varchar(255) not null,
  description text not null,
  earned_at timestamp with time zone default timezone('utc'::text, now())
);

-- Streaks
create table if not exists streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  date date not null,
  activity_type varchar(100) not null,
  count integer default 1
);

-- Community posts
create table if not exists community_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  topic varchar(255) not null,
  title varchar(500) not null,
  content text not null,
  type varchar(50) not null,
  upvotes integer default 0,
  comments jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for better performance
create index if not exists idx_roadmaps_user_id on roadmaps(user_id);
create index if not exists idx_resources_topic on resources(topic);
create index if not exists idx_quizzes_topic on quizzes(topic);
create index if not exists idx_coding_problems_topic on coding_problems(topic);
create index if not exists idx_user_projects_user_id on user_projects(user_id);
create index if not exists idx_users_email on users(email);
