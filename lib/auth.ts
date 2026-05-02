// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongoClient';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword } from '@/lib/password';

const hasMongo = Boolean(process.env.MONGODB_URI);
const hasGoogleAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasEmailTransport = Boolean(
  process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_PORT &&
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD &&
    process.env.EMAIL_FROM
);

const emailTransport =
  hasEmailTransport && process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_PORT && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD
    ? nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })
    : null;

async function connectToDatabaseSafely(context: string) {
  try {
    await connectToDatabase();
    return true;
  } catch (error) {
    console.error(`[auth] database connection failed during ${context}:`, error);
    return false;
  }
}

const providers = [
  CredentialsProvider({
    name: 'Agency login',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;

      console.log('[auth] authorize called for', { email, hasMongo });

      if (!email || !password || !hasMongo) {
        console.log('[auth] authorize missing credentials or missing mongo', { email, hasMongo });
        return null;
      }

      const connected = await connectToDatabaseSafely('credentials authorize');
      if (!connected) {
        return null;
      }

      const user = await User.findOne({ email });
      console.log('[auth] user lookup result', { found: Boolean(user), id: user?._id?.toString?.() });

      if (!user?.passwordHash) {
        console.log('[auth] no passwordHash for user', { email });
        return null;
      }

      const passwordMatches = await verifyPassword(password, user.passwordHash);
      console.log('[auth] password match result', { email, passwordMatches });

      if (!passwordMatches) {
        return null;
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId ? user.workspaceId.toString() : '',
      };
    },
  }),
  hasGoogleAuth
    ? GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      })
    : null,
  hasEmailTransport && emailTransport && process.env.EMAIL_FROM
    ? EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST || '',
          port: Number(process.env.EMAIL_SERVER_PORT || 587),
          auth: {
            user: process.env.EMAIL_SERVER_USER || '',
            pass: process.env.EMAIL_SERVER_PASSWORD || '',
          },
        },
        from: process.env.EMAIL_FROM,
        async sendVerificationRequest({ identifier, url, provider }) {
          await emailTransport.sendMail({
            to: identifier,
            from: provider.from,
            subject: 'Your ClientOS magic link',
            text: `Sign in to ClientOS: ${url}`,
            html: `<p>Sign in to ClientOS by clicking this link:</p><p><a href="${url}">${url}</a></p>`,
          });
        },
      })
    : null,
].filter(Boolean) as NonNullable<NextAuthOptions['providers']>[number][];

export const authOptions: NextAuthOptions = {
  adapter: hasMongo ? MongoDBAdapter(clientPromise) : undefined,
  session: {
    strategy: 'jwt',
  },
  providers,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ account, user }) {
      if (!hasMongo || !account?.provider || !user.email) {
        return true;
      }

      const connected = await connectToDatabaseSafely('signIn callback');
      if (!connected) {
        return false;
      }

      const existingUser = await User.findOne({ email: user.email.toLowerCase() });

      if (!existingUser) {
        const role = account.provider === 'email' ? 'client' : 'agency';

        await User.create({
          name: user.name || user.email,
          email: user.email.toLowerCase(),
          role,
          workspaceId: null,
        });
      } else if (account.provider === 'google' && existingUser.role !== 'agency') {
        existingUser.role = 'agency';
        if (!existingUser.name && user.name) {
          existingUser.name = user.name;
        }
        await existingUser.save();
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (!token.email && user?.email) {
        token.email = user.email;
      }

      if (hasMongo && token.email) {
        const connected = await connectToDatabaseSafely('jwt callback');
        if (connected) {
          const dbUser = await User.findOne({ email: token.email.toLowerCase() });

          if (dbUser) {
            token.name = dbUser.name || token.name;
            token.role = dbUser.role;
            token.workspaceId = dbUser.workspaceId ? dbUser.workspaceId.toString() : null;
            token.sub = dbUser._id.toString();
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.role = token.role || 'client';
        session.user.workspaceId = token.workspaceId || null;
      }

      return session;
    },
  },
};
