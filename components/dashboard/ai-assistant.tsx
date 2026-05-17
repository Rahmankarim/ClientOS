'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wand2, Loader } from 'lucide-react'

interface AIScope {
  title: string
  description: string
  estimatedHours: number
}

export function AIAssistant({ projectId }: { projectId: string }) {
  const { data: session, status } = useSession()
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectDescription, setProjectDescription] = useState('')
  const [generatedScopes, setGeneratedScopes] = useState<AIScope[]>([])
  const [error, setError] = useState('')

  const generateScopeAnalysis = async () => {
    if (!projectDescription.trim()) return

    if (status !== 'authenticated') {
      setError('Please sign in to use AI features')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/ai/analyze-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectDescription }),
      })

      if (!res.ok) {
        let body: any = null
        let text: string | null = null
        try {
          text = await res.text()
          try {
            body = text ? JSON.parse(text) : null
          } catch {
            body = null
          }
        } catch (e) {
          console.error('Failed to read error body', e)
        }

        const statusText = res.statusText || `status ${res.status}`
        const snippet = text && text.trim().startsWith('<') ? text.trim().slice(0, 200) : text

        console.error('analyze-scope error', { status: res.status, statusText, body, snippet })
        setError((body && body.error) || snippet || `Failed to generate scope analysis (${statusText})`)
        return
      }

      const data = await res.json()

      // Parse the JSON from the AI response
      try {
        const scopes = JSON.parse(data.analysis)
        setGeneratedScopes(scopes)
      } catch (e) {
        console.error('Failed to parse AI response', e, data)
        setError('Could not parse AI response, please try again')
      }
    } catch (err) {
      setError('Failed to generate scope analysis')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveGeneratedScopes = async () => {
    for (const scope of generatedScopes) {
      try {
        await fetch('/api/scope', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            title: scope.title,
            description: scope.description,
            estimatedHours: scope.estimatedHours,
          }),
        })
      } catch (err) {
        console.error('Error saving scope:', err)
      }
    }
    
    setGeneratedScopes([])
    setProjectDescription('')
    // Refresh the parent component by reloading the scope
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          AI Scope Assistant
        </h3>

        <textarea
          placeholder="Describe your project in detail. The AI will automatically generate a scope breakdown with estimated hours..."
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          className="w-full h-24 p-3 border border-border rounded-md mb-3 text-sm"
        />

        <Button
          onClick={generateScopeAnalysis}
          disabled={isGenerating || !projectDescription.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Scope Analysis
            </>
          )}
        </Button>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </Card>

      {generatedScopes.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Generated Scope Items ({generatedScopes.length})</h4>
          <div className="space-y-3 mb-4">
            {generatedScopes.map((scope, idx) => (
              <div key={idx} className="p-3 border border-border rounded-lg">
                <p className="font-medium">{scope.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{scope.description}</p>
                <p className="text-sm font-semibold mt-2">{scope.estimatedHours} hours</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={saveGeneratedScopes} className="flex-1">
              Save All Scopes
            </Button>
            <Button
              onClick={() => setGeneratedScopes([])}
              variant="outline"
              className="flex-1"
            >
              Discard
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
