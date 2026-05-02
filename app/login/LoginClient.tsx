"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, LockKeyhole, Mail, Sparkles } from 'lucide-react'

export default function LoginClient() {
  const router = useRouter()
  let callbackUrl = '/dashboard'
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search)
    callbackUrl = sp.get('callbackUrl') || '/dashboard'
  }

  const [ownerName, setOwnerName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSendingLink, setIsSendingLink] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleOwnerSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSigningUp(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ownerName,
          email: ownerEmail,
          password: ownerPassword,
          workspaceName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create your workspace.')
      }

      const signInResult = await signIn('credentials', {
        email: ownerEmail,
        password: ownerPassword,
        callbackUrl,
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error(signInResult.error)
      }

      router.push(callbackUrl)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create your account.')
    } finally {
      setIsSigningUp(false)
    }
  }

  async function handleOwnerSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSigningIn(true)

    try {
      const result = await signIn('credentials', {
        email: ownerEmail,
        password: ownerPassword,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        throw new Error('Invalid email or password.')
      }

      router.push(callbackUrl)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSigningIn(false)
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage('')
    setSuccessMessage('')
    await signIn('google', { callbackUrl })
  }

  async function handleClientMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSendingLink(true)

    try {
      const result = await signIn('email', {
        email: clientEmail,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      setSuccessMessage('Check your inbox for a magic link to open your portal.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send magic link.')
    } finally {
      setIsSendingLink(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_28%),linear-gradient(to_bottom,_hsl(var(--background)),_hsl(var(--muted)/0.2))]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex flex-col justify-center space-y-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              AI-powered delivery for small dev agencies
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                ClientOS keeps agencies, clients, and AI updates in one delivery system.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Owners sign in with Google or email and password. Clients get passwordless magic links to their project portal.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                <div className="text-sm font-medium text-foreground">Owner login</div>
                <div className="mt-1 text-sm text-muted-foreground">Google or password auth</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                <div className="text-sm font-medium text-foreground">Client access</div>
                <div className="mt-1 text-sm text-muted-foreground">Magic link only, no password</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                <div className="text-sm font-medium text-foreground">Role-aware</div>
                <div className="mt-1 text-sm text-muted-foreground">Workspace and portal isolation</div>
              </div>
            </div>
          </section>

          <Card className="border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Welcome to ClientOS</CardTitle>
              <CardDescription>
                Start a workspace, sign in as an agency owner, or send a client magic link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <Button onClick={handleGoogleSignIn} className="h-11 w-full gap-2" variant="outline">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.55 2.7-2.87 4.3-5.35 4.3a6.1 6.1 0 1 1 0-12.2c1.38 0 2.62.49 3.6 1.4l2.34-2.34A9.3 9.3 0 0 0 12 2.2a9.8 9.8 0 1 0 9.35 8.9Z" />
                  </svg>
                  Continue with Google
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <Separator className="flex-1" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>

                <form className="space-y-4" onSubmit={handleOwnerSignIn}>
                  <div className="space-y-2">
                    <Label htmlFor="owner-email">Agency email</Label>
                    <Input id="owner-email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} type="email" placeholder="you@agency.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-password">Password</Label>
                    <Input id="owner-password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} type="password" placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="h-11 w-full gap-2" disabled={isSigningIn}>
                    {isSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                    Sign in with password
                  </Button>
                </form>

                <form className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4" onSubmit={handleOwnerSignup}>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">Create an agency workspace</h2>
                    <p className="text-xs text-muted-foreground">This creates your owner account and workspace together.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="owner-name">Owner name</Label>
                      <Input id="owner-name" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="Rahman Karim" required />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="workspace-name">Workspace name</Label>
                      <Input id="workspace-name" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Studio North" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-signup-email">Email</Label>
                    <Input id="owner-signup-email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} type="email" placeholder="you@agency.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-signup-password">Password</Label>
                    <Input id="owner-signup-password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} type="password" placeholder="Create a strong password" required />
                  </div>
                  <Button type="submit" className="h-11 w-full gap-2" disabled={isSigningUp}>
                    {isSigningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Create workspace
                  </Button>
                </form>

                <form className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4" onSubmit={handleClientMagicLink}>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">Client portal access</h2>
                    <p className="text-xs text-muted-foreground">Send a passwordless sign-in link to a client email address.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Client email</Label>
                    <Input id="client-email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} type="email" placeholder="client@company.com" required />
                  </div>
                  <Button type="submit" variant="secondary" className="h-11 w-full gap-2" disabled={isSendingLink}>
                    {isSendingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send magic link
                  </Button>
                </form>
              </div>

              {(errorMessage || successMessage) && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${errorMessage ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
                  {errorMessage || successMessage}
                </div>
              )}

              <p className="text-xs leading-relaxed text-muted-foreground">
                Agency owners use Google OAuth or email/password. Clients use the email provider with a magic link. Configure the URLs and secrets in <code className="rounded bg-muted px-1 py-0.5">.env.local</code> using <code className="rounded bg-muted px-1 py-0.5">.env.example</code> as the template.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
