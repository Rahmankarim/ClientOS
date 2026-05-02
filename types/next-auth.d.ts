import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'agency' | 'client';
      workspaceId: string | null;
    };
  }

  interface User {
    role?: 'agency' | 'client';
    workspaceId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'agency' | 'client';
    workspaceId?: string | null;
  }
}