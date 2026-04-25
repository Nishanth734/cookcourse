# CourseCook - Quick Start Guide

## 🚀 Getting Your Platform Running

This guide will help you get the CourseCook platform up and running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn** package manager

### Step 1: Set Up PostgreSQL Database

1. **Install PostgreSQL** (if not already installed)
   - Windows: Use the official installer or PGAdmin
   - Mac: `brew install postgresql`
   - Linux: `sudo apt install postgresql`

2. **Create a Database**
   ```bash
   # Login to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE coursecook;
   
   # Exit
   \q
   ```

3. **Note Your Database Credentials**
   - Username: `postgres` (or your username)
   - Password: Your PostgreSQL password
   - Database: `coursecook`
   - Port: `5432` (default)

### Step 2: Configure Environment Variables

1. Open the `.env.local` file in the project root
2. Update the following variables:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/coursecook?schema=public"

# NextAuth - Generate a secure random string
NEXTAUTH_SECRET="your-secret-key-here-generate-random-string"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI API - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key"
```

**To generate NEXTAUTH_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Step 3: Install Dependencies

```bash
# Navigate to project directory
cd coursecook

# Install dependencies
npm install
```

### Step 4: Set Up Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

This will:
- Create all database tables
- Set up relationships and constraints
- Create the initial migration

### Step 5: Start Development Server

```bash
npm run dev
```

The server will start on **http://localhost:3000**

### Step 6: Create Your First Account

1. Open http://localhost:3000
2. Click "Get Started Free" or "Sign Up"
3. Fill in your details:
   - Name: Your name
   - Email: your@email.com
   - Password: Choose a secure password
4. Click "Create Account"

### Step 7: Explore the Platform

After signing up, you'll be redirected to the dashboard where you can:

✅ **View Your Dashboard** - See readiness scores, daily tasks, and progress  
✅ **Generate AI Roadmap** - Create personalized learning paths  
✅ **Browse Resources** - Access curated courses and tutorials  
✅ **Practice Coding** - Solve programming problems  
✅ **Take Quizzes** - Test your knowledge  
✅ **Build Resume** - Create ATS-optimized resumes  
✅ **Mock Interviews** - Practice with AI-powered interviews  

## 🎯 Next Steps

### Add Sample Data (Optional)

You can seed the database with sample data for testing:

```bash
# Create a seed script
npx prisma db seed
```

### Test AI Features

To test the AI-powered features, make sure you have a valid OpenAI API key:

1. **Roadmap Generation**: Go to Dashboard → My Roadmap → Generate New Roadmap
2. **Quiz Generation**: Go to Quizzes → Create New Quiz
3. **AI Mentor**: Use the chat widget on the dashboard
4. **ATS Optimization**: Go to ATS Optimizer → Upload Resume

### Customize the Platform

- **Branding**: Update colors in `src/app/globals.css`
- **Features**: Modify components in `src/components/`
- **API Routes**: Extend functionality in `src/app/api/`
- **Database Schema**: Update `prisma/schema.prisma` and run `npx prisma migrate dev`

## 🐛 Troubleshooting

### Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in `.env.local`
3. Verify username, password, and database name

```bash
# Check if PostgreSQL is running
# Windows
Get-Service postgresql*

# Mac/Linux
sudo service postgresql status
```

### Prisma Client Error

**Error**: `Module '"@prisma/client"' has no exported member 'PrismaClient'`

**Solution**:
```bash
npx prisma generate
```

### OpenAI API Error

**Error**: `Invalid API key` or `Rate limit exceeded`

**Solution**:
1. Verify your OpenAI API key is correct
2. Check your API quota at https://platform.openai.com/
3. For testing, you can mock AI responses temporarily

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

Or start on a different port:
```bash
npm run dev -- -p 3001
```

## 📚 Project Structure

```
coursecook/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js pages
│   │   ├── (auth)/           # Login, Signup pages
│   │   ├── (marketing)/      # Landing page
│   │   ├── dashboard/        # User dashboard
│   │   └── api/              # API routes
│   ├── components/           # React components
│   ├── lib/                  # Utilities (Prisma, AI)
│   └── types/                # TypeScript types
├── public/                   # Static assets
├── .env.local                # Environment variables
└── package.json              # Dependencies
```

## 🎨 Customization

### Change Theme Colors

Edit `src/app/globals.css`:

```css
:root {
  --primary: #4f46e5;      /* Main brand color */
  --secondary: #10b981;    /* Success/accent color */
  --accent: #f59e0b;       /* Warning/highlight color */
}
```

### Add New Features

1. **Create API Route**: Add file in `src/app/api/[feature]/route.ts`
2. **Create Page**: Add file in `src/app/[route]/page.tsx`
3. **Create Component**: Add file in `src/components/[name].tsx`
4. **Update Database**: Modify `prisma/schema.prisma` and run migration

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Set Environment Variables on Vercel

1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add all variables from `.env.local`

### Database Hosting

Use one of these managed PostgreSQL services:
- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Railway**: https://railway.app

Update `DATABASE_URL` with your hosted database URL.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main README.md
3. Check the plan document for architecture details

## 🎉 You're Ready!

Your CourseCook platform is now running locally. Start exploring and customizing it to fit your needs!

**Happy Coding! 🚀**
