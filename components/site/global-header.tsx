'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

function navLinkClass(active: boolean) {
  return active
    ? 'text-foreground'
    : 'text-muted-foreground hover:text-foreground transition-colors';
}

export default function GlobalHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Hide global header on dashboard routes to avoid duplicate headers
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);
  const dashboardHref = isAuthenticated ? '/dashboard' : '/login';
  const proposalsHref = isAuthenticated ? '/proposals/new' : '/login';

  return (
    <header className="border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
            C
          </span>
          <div>
            <p className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              ClientOS
            </p>
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              AI Delivery Platform
            </p>
          </div>
        </Link>

        <nav className="order-3 flex w-full items-center gap-4 overflow-x-auto border-t border-border/50 pt-3 text-sm sm:order-2 sm:w-auto sm:border-0 sm:pt-0 md:gap-6">
          <Link href="/" className={navLinkClass(pathname === '/')}>
            Home
          </Link>
          <Link href={dashboardHref} className={navLinkClass(pathname.startsWith('/dashboard'))}>
            Dashboard
          </Link>
          <Link href={proposalsHref} className={navLinkClass(pathname.startsWith('/proposals'))}>
            Proposals
          </Link>
        </nav>

        <div className="order-2 flex items-center gap-2 sm:order-3">
          {isAuthenticated ? (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Open Workspace</Link>
              </Button>
              <Button
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
