# Supabase & OpenRouter Setup Guide

This guide will help you set up Supabase (database) and OpenRouter (AI) for CourseCook.

## 🗄️ Part 1: Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Sign up/login with GitHub or email
4. Click **"New Project"**
5. Fill in:
   - **Project name**: `coursecook` (or your preferred name)
   - **Database password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
6. Click **"Create new project"**
7. Wait 2-3 minutes for setup to complete

### Step 2: Get Your Supabase Credentials

1. Go to your project dashboard
2. Click **Settings** (gear icon) → **API**
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (long string)
   - **service_role key**: `eyJhbG...` (different long string)

### Step 3: Set Up Database Schema

You have two options:

#### Option A: Use SQL Editor (Recommended)

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"+ New query"**
3. Copy and paste the SQL schema below
4. Click **"Run"** (or press Ctrl+Enter)

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table users (
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
create table user_profiles (
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
create table roadmaps (
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
create table phase_progress (
  id uuid default uuid_generate_v4() primary key,
  roadmap_id uuid references roadmaps(id) on delete cascade,
  phase_name varchar(255) not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  subtopics jsonb
);

-- Resources
create table resources (
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

-- Bookmarks
create table bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  resource_id uuid references resources(id) on delete set null,
  note_id uuid references user_notes(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, resource_id),
  unique(user_id, note_id)
);

-- User notes
create table user_notes (
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

-- Quizzes
create table quizzes (
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
create table quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete cascade,
  score decimal not null,
  answers jsonb not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()),
  time_taken integer
);

-- Coding problems
create table coding_problems (
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
create table coding_submissions (
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
create table mock_interviews (
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
create table projects (
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
create table user_projects (
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
create table placement_stories (
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
create table resumes (
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
create table daily_planner (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  date date not null,
  tasks jsonb not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Achievements
create table achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  badge varchar(100) not null,
  title varchar(255) not null,
  description text not null,
  earned_at timestamp with time zone default timezone('utc'::text, now())
);

-- Streaks
create table streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  date date not null,
  activity_type varchar(100) not null,
  count integer default 1
);

-- Community posts
create table community_posts (
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
create index idx_roadmaps_user_id on roadmaps(user_id);
create index idx_resources_topic on resources(topic);
create index idx_quizzes_topic on quizzes(topic);
create index idx_coding_problems_topic on coding_problems(topic);
create index idx_user_projects_user_id on user_projects(user_id);

-- Enable Row Level Security (RLS)
alter table users enable row level security;
alter table user_profiles enable row level security;
alter table roadmaps enable row level security;
alter table phase_progress enable row level security;
alter table resources enable row level security;
alter table bookmarks enable row level security;
alter table user_notes enable row level security;
alter table quizzes enable row level security;
alter table quiz_attempts enable row level security;
alter table coding_problems enable row level security;
alter table coding_submissions enable row level security;
alter table mock_interviews enable row level security;
alter table projects enable row level security;
alter table user_projects enable row level security;
alter table placement_stories enable row level security;
alter table resumes enable row level security;
alter table daily_planner enable row level security;
alter table achievements enable row level security;
alter table streaks enable row level security;
alter table community_posts enable row level security;

-- RLS Policies (allow authenticated users to access their own data)
create policy "Users can view own data" on users
  for select using (auth.uid() = id);

create policy "Users can update own data" on users
  for update using (auth.uid() = id);

create policy "Users can view own roadmaps" on roadmaps
  for select using (auth.uid() = user_id);

create policy "Users can create own roadmaps" on roadmaps
  for insert with check (auth.uid() = user_id);

create policy "Users can update own roadmaps" on roadmaps
  for update using (auth.uid() = user_id);

-- Similar policies for other tables...
-- For simplicity, service_role key bypasses RLS in API routes
```

#### Option B: Use Prisma Migration (Alternative)

If you prefer using the existing Prisma schema:

1. Keep the `prisma/schema.prisma` file
2. Run: `npx prisma db push`
3. This will create tables automatically

### Step 4: Update Environment Variables

1. Open `.env.local` in your project
2. Update these values with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres"
```

---

## 🤖 Part 2: OpenRouter Setup

### Step 1: Create an OpenRouter Account

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Click **"Sign Up"** (top right)
3. Sign up with Google, GitHub, or email
4. Verify your email

### Step 2: Get Your API Key

1. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Click **"Create Key"**
3. Give it a name: `CourseCook`
4. Copy the API key (starts with `sk-or-v1-...`)

### Step 3: Choose Your AI Model

OpenRouter supports multiple models. Popular choices:

- **openai/gpt-4** - Best quality, higher cost
- **openai/gpt-3.5-turbo** - Good balance
- **anthropic/claude-2** - Excellent for reasoning
- **meta-llama/llama-3-70b-instruct** - Free option
- **mistralai/mixtral-8x7b-instruct** - Free option

For development, start with a free model, then upgrade for production.

### Step 4: Update Environment Variables

Add to `.env.local`:

```env
OPENROUTER_API_KEY="sk-or-v1-your-key-here"
OPENROUTER_API_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="openai/gpt-4"  # Change to your preferred model
```

### Step 5: Test Your OpenRouter Setup

```bash
# Test API connection
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## 🚀 Part 3: Run the Application

### Step 1: Install Dependencies

```bash
cd "e:\All Projects\dsu\coursecook"
npm install
```

### Step 2: Verify Environment Variables

Make sure `.env.local` has all required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OpenRouter
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_API_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="openai/gpt-4"
```

### Step 3: Start Development Server

```bash
npm run dev
```

### Step 4: Test the Application

1. Open http://localhost:3000
2. Create an account (Sign Up)
3. Login and explore the dashboard
4. Test AI features (roadmap generation, etc.)

---

## 🔧 Troubleshooting

### Supabase Connection Error

**Error**: `Invalid API key` or `Failed to connect`

**Solution**:
1. Verify your Supabase URL and keys are correct
2. Check if your project is active in Supabase dashboard
3. Ensure database schema is created (run SQL script)

### OpenRouter API Error

**Error**: `Invalid API key` or `Model not found`

**Solution**:
1. Check your API key at https://openrouter.ai/keys
2. Verify the model name is correct (see available models at https://openrouter.ai/models)
3. Check your credit balance (add credits if needed)

### RLS Policy Errors

**Error**: `new row violates row-level security policy`

**Solution**:
The service_role key bypasses RLS. Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` in API routes, not the anon key.

### Database Schema Missing

**Error**: `relation "users" does not exist`

**Solution**:
Run the SQL schema in Supabase SQL Editor (see Step 3 above).

---

## 💡 Tips

### Cost Optimization

- **Supabase**: Free tier includes 500MB database, 1GB file storage, 50,000 monthly active users
- **OpenRouter**: Many free models available. Paid models charge per token (much cheaper than direct OpenAI)

### Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use service_role key only in API routes** - Never expose in frontend
3. **Test with free models first** - Upgrade when ready for production
4. **Monitor usage** - Check OpenRouter dashboard for API usage

### Next Steps

1. Add sample data to test features
2. Customize AI prompts for your use case
3. Add more RLS policies for security
4. Deploy to Vercel when ready

---

**Need help?** Check the main README.md or IMPLEMENTATION_SUMMARY.md
