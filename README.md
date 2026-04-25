# CourseCook - AI-Powered EdTech & Career Preparation Platform

> Your complete career preparation ecosystem. Learn, practice, and get placed.

## 🚀 Overview

CourseCook is a modern, AI-powered edtech platform that helps users go from learning a skill to becoming job-ready and placement-ready. It combines learning, practice, revision, interviews, resume optimization, and placement support in one ecosystem.

## ✨ Features

### Core Modules
1. **AI-Powered Roadmap Builder** - Personalized learning paths from beginner to advanced
2. **Curated Resource Ecosystem** - Best courses, tutorials, and docs organized by topic
3. **Placement Stories** - Real success stories and career path examples
4. **Notes & Revision Hub** - Topic-wise notes, cheat sheets, and flashcards
5. **Dynamic Quiz Engine** - Adaptive quizzes based on progress and weak areas
6. **Coding Practice Arena** - LeetCode-style problems with company tags
7. **Mock Interview Platform** - AI-powered technical and behavioral interviews
8. **Daily Planner** - Personalized study schedules and task management
9. **Project Builder** - Real-world projects with milestones and deployment guides
10. **Progress Dashboard** - Analytics, readiness scores, and skill mastery tracking
11. **AI Mentor Assistant** - 24/7 personalized coaching and doubt clearing
12. **Company-Specific Tracks** - Preparation guides for top companies
13. **Resume Builder** - Professional resume creation with role-specific templates
14. **ATS Optimizer** - Resume analysis and optimization for applicant tracking systems
15. **Portfolio Builder** - GitHub, LinkedIn optimization, and job readiness tools
16. **Community & Gamification** - Badges, leaderboards, and study circles
17. **Admin CMS** - Content management and analytics dashboard
18. **Smart Recommendations** - Skill gap detection and personalized suggestions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (Managed PostgreSQL)
- **Authentication**: NextAuth.js
- **AI Integration**: OpenRouter API (Access to GPT-4, Claude, Llama, and 100+ models)
- **State Management**: Zustand, React Query
- **Code Editor**: Monaco Editor
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account (free tier available)
- OpenRouter account (free tier available)

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd coursecook
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenRouter
OPENROUTER_API_KEY="your-openrouter-api-key"
OPENROUTER_API_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="openai/gpt-4"
```

**Get your credentials:**
- **Supabase**: Create project at https://supabase.com → Settings → API
- **OpenRouter**: Sign up at https://openrouter.ai → Create API key
- **NEXTAUTH_SECRET**: Run `openssl rand -base64 32` (Mac/Linux) or see QUICKSTART.md

### 3. Set Up Database

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Set database password and region
   - Wait 2-3 minutes for setup

2. **Run Database Schema**
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `database-schema.sql`
   - Paste and click "Run"

3. **Get Your Credentials**
   - Settings → API
   - Copy Project URL, anon key, and service_role key
   - Update `.env.local` with these values

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
coursecook/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (marketing)/      # Landing and marketing pages
│   │   ├── dashboard/        # User dashboard pages
│   │   ├── admin/            # Admin dashboard pages
│   │   └── api/              # API routes
│   ├── components/           # React components
│   ├── lib/                  # Utilities and configurations
│   ├── services/             # Business logic services
│   ├── hooks/                # Custom React hooks
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
└── package.json
```

## 🗄️ Database Schema

The platform uses a comprehensive PostgreSQL schema with the following core models:

- **User** - User accounts and profiles
- **Roadmap** - AI-generated learning paths
- **Resource** - Curated learning materials
- **Quiz** - Assessments and quizzes
- **CodingProblem** - Coding challenges
- **MockInterview** - Interview sessions
- **Project** - Real-world projects
- **Resume** - User resumes
- **PlacementStory** - Success stories
- **CommunityPost** - Community discussions
- **CompanyTrack** - Company-specific prep guides

See `prisma/schema.prisma` for the complete schema.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler

### AI Features
- `POST /api/ai/roadmap` - Generate personalized roadmap
- `POST /api/ai/quiz` - Generate adaptive quiz
- `POST /api/ai/mentor` - AI mentor chat
- `POST /api/ai/ats` - ATS resume analysis
- `POST /api/ai/interview` - Mock interview feedback

### Core Features
- `GET/POST /api/roadmap` - Roadmap CRUD
- `GET/POST /api/resources` - Resource listing and bookmarking
- `GET/POST /api/quiz` - Quiz management
- `GET/POST /api/coding` - Coding problems and submissions
- `GET/POST /api/projects` - Project tracking
- `GET/POST /api/resume` - Resume management

## 🎨 UI/UX Design

### Design System
- **Primary Color**: Indigo-600 (#4f46e5)
- **Secondary Color**: Emerald-500 (#10b981)
- **Accent Color**: Amber-500 (#f59e0b)
- **Typography**: Inter/system fonts
- **Components**: Card-based layout with hover effects, gradients, and smooth animations

### Key Pages
- Landing page with animated hero section
- Personalized dashboard with readiness scores
- Visual roadmap tree with progress tracking
- Resource explorer with filters and bookmarks
- Coding arena with Monaco editor
- Interview room with real-time feedback
- Resume builder with live preview
- ATS optimizer with score visualization

## 🤖 AI Integration

The platform leverages OpenAI's GPT-4 for:

1. **Roadmap Generation** - Creates structured learning paths based on topic, level, and goals
2. **Quiz Generation** - Adapts difficulty based on user performance
3. **Interview Evaluation** - Provides detailed feedback on technical responses
4. **ATS Optimization** - Analyzes resumes and suggests improvements
5. **AI Mentor** - Personalized coaching and doubt clearing
6. **Topic Summarization** - Creates concise revision notes

## 📊 User Flow

1. **Sign Up** → Create account
2. **Onboarding** → Select goals, topics, skill level, target companies
3. **Get Roadmap** → AI generates personalized learning path
4. **Learn** → Follow curated resources and take notes
5. **Practice** → Solve quizzes and coding problems
6. **Build** → Complete real-world projects
7. **Interview** → Attend mock interviews with AI feedback
8. **Resume** → Build and optimize resume with ATS
9. **Apply** → Track job applications and get placed

## 🎯 Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Project setup, database, authentication
- Landing page, auth pages, onboarding
- Basic dashboard layout

### Phase 2: Core Learning (Weeks 3-4)
- AI roadmap generation
- Resource explorer
- Quiz system
- Daily planner

### Phase 3: Practice & Assessment (Weeks 5-6)
- Coding practice arena
- Code execution engine
- Mock interviews
- AI mentor chat

### Phase 4: Career Readiness (Weeks 7-8)
- Project tracking
- Resume builder
- ATS optimizer
- Placement stories

### Phase 5: Analytics & Community (Weeks 9-10)
- Progress analytics dashboard
- Community features
- Company tracks
- Admin dashboard

### Phase 6: Polish & Launch (Weeks 11-12)
- Performance optimization
- Mobile responsiveness
- Testing & bug fixes
- Deployment

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (User, Admin, Mentor)
- API rate limiting
- Input validation with Zod
- Secure session management

## 🚀 Deployment

### Frontend & API
Deploy to Vercel:
```bash
vercel --prod
```

### Database
Use Supabase or Neon for managed PostgreSQL:
- Create a PostgreSQL database
- Update `DATABASE_URL` in environment variables
- Run migrations: `npx prisma migrate deploy`

### Environment Variables
Set all required environment variables in your deployment platform.

## 📝 License

This project is proprietary and confidential.

## 👥 Support

For support and questions, please contact the development team.

---

Built with ❤️ for learners worldwide
