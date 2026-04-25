import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

type DbUserIdentity = {
  id: string
  role: string
}

function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

async function resolveDbUserByEmail(email: string): Promise<DbUserIdentity | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('email', email)
    .single()

  if (error || !data) {
    return null
  }

  return data as DbUserIdentity
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // If signing in with Google, create/update user in database
      if (account?.provider === 'google' && user.email) {
        const { data: dbUser, error } = await supabaseAdmin
          .from('users')
          .upsert(
            {
              email: user.email,
              name: user.name || user.email.split('@')[0],
              password: '', // No password for OAuth users
              role: 'USER',
              skill_level: 'BEGINNER',
              daily_study_hours: 2.0,
              avatar: user.image || null,
            },
            { onConflict: 'email' }
          )
          .select('id, role')
          .single()

        if (error || !dbUser) {
          console.error('Google sign-in user sync failed:', error)
          return false
        }

        user.id = dbUser.id
        ;(user as typeof user & { role?: string }).role = dbUser.role
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }

      if (
        token.email &&
        (typeof token.id !== 'string' || !isUUID(token.id))
      ) {
        const dbUser = await resolveDbUserByEmail(token.email)
        if (dbUser) {
          token.id = dbUser.id
          token.role = token.role ?? dbUser.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
