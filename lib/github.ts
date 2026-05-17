import crypto from 'crypto'

export function verifyGitHubWebhook(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || ''
  if (!secret || !signature) {
    return false
  }

  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const expectedSignature = `sha256=${hash}`
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
}

export async function fetchGitHubUser(accessToken: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch('https://api.github.com/user', { headers })

  if (!res.ok) throw new Error('Failed to fetch GitHub user')
  return res.json()
}

export async function fetchGitHubRepo(owner: string, repo: string, accessToken: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })

  if (!res.ok) throw new Error('Failed to fetch GitHub repo')
  return res.json()
}

export async function fetchGitHubIssues(owner: string, repo: string, accessToken: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all`, { headers })

  if (!res.ok) throw new Error('Failed to fetch GitHub issues')
  return res.json()
}

export async function fetchGitHubPullRequests(owner: string, repo: string, accessToken: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all`, { headers })

  if (!res.ok) throw new Error('Failed to fetch GitHub PRs')
  return res.json()
}

export async function createGitHubIssue(
  owner: string,
  repo: string,
  title: string,
  body: string,
  accessToken: string
) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, body }),
  })

  if (!res.ok) throw new Error('Failed to create GitHub issue')
  return res.json()
}
