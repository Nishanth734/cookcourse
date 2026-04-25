# Migration Guide: Prisma → Supabase & OpenAI → OpenRouter

## ✅ What Changed

### Database: Prisma → Supabase
- ❌ Removed: Prisma ORM, Prisma Client, Prisma migrations
- ✅ Added: Supabase JavaScript client, direct SQL schema
- ✅ Benefits: Managed PostgreSQL, built-in auth, real-time subscriptions, auto-scaling

### AI: OpenAI → OpenRouter
- ❌ Removed: OpenAI SDK package
- ✅ Added: Direct HTTP API calls to OpenRouter
- ✅ Benefits: Access to multiple AI models, cheaper pricing, no vendor lock-in

---

## 📦 Package Changes

### Removed
```bash
npm uninstall prisma @prisma/client
```

### Added
```bash
npm install @supabase/supabase-js
```

---

## 🔧 Code Changes

### 1. Database Client

**Before (Prisma):**
```typescript
import { prisma } from '@/lib/prisma'

const user = await prisma.user.findUnique({
  where: { email }
})
```

**After (Supabase):**
```typescript
import { supabaseAdmin } from '@/lib/supabase'

const { data: user, error } = await supabaseAdmin
  .from('users')
  .select('*')
  .eq('email', email)
  .single()
```

### 2. Creating Records

**Before (Prisma):**
```typescript
const user = await prisma.user.create({
  data: { email, password, name }
})
```

**After (Supabase):**
```typescript
const { data: user, error } = await supabaseAdmin
  .from('users')
  .insert({ email, password, name })
  .select()
  .single()
```

### 3. AI Calls

**Before (OpenAI):**
```typescript
import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...]
})
```

**After (OpenRouter):**
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4',
    messages: [...]
  })
})
const data = await response.json()
```

---

## 🗄️ Database Setup

### Old Way (Prisma)
```bash
npx prisma generate
npx prisma migrate dev
```

### New Way (Supabase)
1. Create Supabase project at https://supabase.com
2. Run SQL schema in Supabase SQL Editor
3. Copy `database-schema.sql` contents
4. Paste and execute in Supabase dashboard

---

## 🔑 Environment Variables

### Before
```env
DATABASE_URL="postgresql://localhost:5432/coursecook"
OPENAI_API_KEY="sk-..."
```

### After
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# OpenRouter
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_API_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="openai/gpt-4"
```

---

## 📋 Migration Checklist

- [x] Remove Prisma packages
- [x] Install Supabase package
- [x] Create Supabase client (`src/lib/supabase.ts`)
- [x] Replace OpenAI with OpenRouter (`src/lib/ai.ts`)
- [x] Update authentication routes
- [x] Update registration route
- [x] Update roadmap API route
- [x] Create SQL schema file
- [x] Update environment variables
- [x] Create setup documentation
- [ ] Run SQL schema in Supabase
- [ ] Test all features locally

---

## 🚀 Getting Started with New Setup

### 1. Set Up Supabase
Follow `SUPABASE_OPENROUTER_SETUP.md` Part 1

### 2. Set Up OpenRouter
Follow `SUPABASE_OPENROUTER_SETUP.md` Part 2

### 3. Update .env.local
Copy all credentials to `.env.local`

### 4. Run the App
```bash
npm run dev
```

---

## 💡 Key Differences

### Supabase vs Prisma

| Feature | Prisma | Supabase |
|---------|--------|----------|
| Type Safety | ✅ Auto-generated types | ✅ TypeScript support |
| Migrations | ✅ Automatic | ❌ Manual SQL |
| Database | Any PostgreSQL | Managed PostgreSQL |
| Hosting | Self-hosted | Cloud (free tier) |
| Real-time | ❌ | ✅ Built-in |
| Auth | ❌ | ✅ Built-in |
| Dashboard | ❌ | ✅ Excellent UI |

### OpenRouter vs OpenAI

| Feature | OpenAI | OpenRouter |
|---------|--------|------------|
| Models | OpenAI only | 100+ models |
| Pricing | Per model | Unified, cheaper |
| API | SDK | REST API |
| Free Tier | Limited | Many free models |
| Vendor Lock-in | High | Low |
| Fallback | ❌ | ✅ Auto-fallback |

---

## 🐛 Common Issues

### Issue: "Cannot find module '@prisma/client'"
**Solution**: Already removed. If error persists, delete `node_modules` and run `npm install`

### Issue: "Supabase connection error"
**Solution**: Check `.env.local` has correct Supabase URL and keys

### Issue: "OpenRouter API error"
**Solution**: Verify API key and model name in `.env.local`

### Issue: "Table does not exist"
**Solution**: Run `database-schema.sql` in Supabase SQL Editor

---

## 📚 Resources

- **Supabase Docs**: https://supabase.com/docs
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Setup Guide**: `SUPABASE_OPENROUTER_SETUP.md`
- **SQL Schema**: `database-schema.sql`

---

## ✅ Testing After Migration

Test these features:
1. User registration
2. User login
3. Dashboard loading
4. Roadmap generation (AI feature)
5. Any other API routes you implement

---

**Migration completed!** 🎉

Your platform now uses:
- ✅ Supabase for database (managed, scalable, free tier)
- ✅ OpenRouter for AI (multi-model, cheaper, flexible)

Next step: Set up Supabase project and run the SQL schema!
