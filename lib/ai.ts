type GroqMessageResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

async function callAI(prompt: string, maxTokens = 1000) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Groq API error: ${response.status} ${body}`)
  }

  const data = (await response.json()) as GroqMessageResponse
  const text = data.choices?.[0]?.message?.content?.trim()

  if (!text) {
    throw new Error('Groq returned no text content')
  }

  return text
}

function parseJsonFromText<T>(text: string): T {
  const candidates = [text]

  const fencedJson = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fencedJson?.[1]) {
    candidates.push(fencedJson[1])
  }

  const objectMatch = text.match(/\{[\s\S]*\}/)
  if (objectMatch?.[0]) {
    candidates.push(objectMatch[0])
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch?.[0]) {
    candidates.push(arrayMatch[0])
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T
    } catch {
      continue
    }
  }

  throw new Error('Claude response did not contain valid JSON')
}

export async function generateScopeAnalysis(projectDescription: string): Promise<string> {
  return callAI(`You are an expert project manager. Analyze the following project description and provide a detailed scope breakdown with estimated hours for each item. Format the response as a JSON array with objects containing "title", "description", and "estimatedHours" fields.

Project: ${projectDescription}

Provide 5-8 scope items that would be typical for this project.`)
}

export async function generateTaskBreakdown(scopeItem: string): Promise<string> {
  return callAI(`You are an expert project manager. Break down this scope item into actionable tasks. Format the response as a JSON array with objects containing "title", "description", and "priority" (low/medium/high) fields.

Scope Item: ${scopeItem}

Provide 3-5 concrete tasks that would complete this scope item.`)
}

export async function analyzeProjectRisks(projectDescription: string): Promise<string> {
  return callAI(`You are an expert project manager. Identify potential risks for the following project and suggest mitigation strategies. Format the response as a JSON array with objects containing "risk", "severity" (low/medium/high), and "mitigation" fields.

Project: ${projectDescription}

Identify 3-5 key risks and their mitigation strategies.`)
}

export async function generateGitHubClientUpdate(params: {
  projectName: string
  repository: string
  commitCount: number
  commitSummaries: string[]
}) {
  return callAI(
    `You are writing a concise client-facing project update for ${params.projectName}.\n\nRepository: ${params.repository}\nCommits in this push: ${params.commitCount}\nCommit summaries:\n${params.commitSummaries.map((summary, index) => `${index + 1}. ${summary}`).join('\n')}\n\nWrite exactly 2-3 professional sentences. Avoid technical jargon and code identifiers where possible. Mention business-facing progress and confidence without overpromising.`
  )
}

export async function generateMilestoneClientUpdate(params: {
  milestoneTitle: string
  completionPercentage: number
  tasks: Array<{ title: string; status: string }>
}) {
  return callAI(
    `Create a professional client-facing progress update in 2-3 sentences.\n\nMilestone: ${params.milestoneTitle}\nCompletion: ${params.completionPercentage}%\nTasks:\n${params.tasks.map((task, index) => `${index + 1}. ${task.title} - ${task.status}`).join('\n')}\n\nKeep the tone clear, confident, and non-technical.`
  )
}

export async function scopeCheck(params: { originalBrief: string; newRequest: string }) {
  const text = await callAI(
    `Compare this new request against the original project brief and determine if it is in scope.\n\nOriginal brief:\n${params.originalBrief}\n\nNew request:\n${params.newRequest}\n\nReturn strictly valid JSON in this exact shape:\n{ "isInScope": boolean, "reason": string, "suggestedResponse": string }\n\nThe suggestedResponse should be polite, concise, and ready to send to a client.`
  )

  return parseJsonFromText<{ isInScope: boolean; reason: string; suggestedResponse: string }>(text)
}

export async function generateMilestonesPlan(projectBrief: string) {
  const text = await callAI(
    `Read this project brief and propose a milestone plan.\n\nProject brief:\n${projectBrief}\n\nReturn strictly valid JSON as an array in this exact shape:\n[{ "title": string, "dueDate": string, "deliverables": string[] }]\n\nUse ISO date strings for dueDate and keep the list practical for an agency workflow.`
  )

  return parseJsonFromText<Array<{ title: string; dueDate: string; deliverables: string[] }>>(text)
}
