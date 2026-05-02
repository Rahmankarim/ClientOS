import Link from 'next/link';

export default function GlobalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border/60 bg-background/80">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">ClientOS</h3>
          <p className="text-sm text-muted-foreground">
            Professional project delivery with AI-assisted scope intelligence, transparent updates, and client collaboration.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Platform</h4>
          <div className="space-y-2 text-sm">
            <Link href="/dashboard" className="block text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/proposals/new" className="block text-muted-foreground hover:text-foreground transition-colors">
              Proposals
            </Link>
            <Link href="/login" className="block text-muted-foreground hover:text-foreground transition-colors">
              Authentication
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Capabilities</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Scope management</li>
            <li>Milestone tracking</li>
            <li>Client portal</li>
            <li>GitHub automation</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Built For</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Agencies</li>
            <li>Freelance studios</li>
            <li>Client success teams</li>
            <li>Product consultancies</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Copyright {year} ClientOS. All rights reserved.</p>
          <p>Designed for reliable, client-friendly delivery operations.</p>
        </div>
      </div>
    </footer>
  );
}
