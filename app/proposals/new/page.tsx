'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type DraftMilestone = {
  title: string;
  dueDate: string;
  deliverables: string;
};

export default function NewProposalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [milestones, setMilestones] = useState<DraftMilestone[]>([
    { title: '', dueDate: '', deliverables: '' },
  ]);
  const [status, setStatus] = useState<'draft' | 'sent'>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateMilestone(index: number, updates: Partial<DraftMilestone>) {
    setMilestones((current) =>
      current.map((milestone, milestoneIndex) =>
        milestoneIndex === index ? { ...milestone, ...updates } : milestone
      )
    );
  }

  function addMilestone() {
    setMilestones((current) => [...current, { title: '', dueDate: '', deliverables: '' }]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          clientName,
          clientEmail,
          status,
          deliverables: deliverables
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          milestones: milestones
            .map((milestone) => ({
              title: milestone.title.trim(),
              dueDate: milestone.dueDate,
              deliverables: milestone.deliverables
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),
            }))
            .filter((milestone) => milestone.title.length > 0),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save proposal');
      }

      router.push(`/proposals/${payload._id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save proposal');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="cosmic-panel lift-in space-y-2 rounded-2xl p-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">New Proposal</h1>
        <p className="text-muted-foreground">
          Build a proposal and send it to your client for approval.
        </p>
      </header>

      <Card className="cosmic-panel">
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
          <CardDescription>Define timeline, deliverables, and milestones.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="proposal-title">Proposal title</Label>
                <Input
                  id="proposal-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Website redesign and launch"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-name">Client name</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Acme Inc"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email">Client email</Label>
                <Input
                  id="client-email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  type="email"
                  placeholder="client@acme.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal-deliverables">Deliverables (one per line)</Label>
              <Textarea
                id="proposal-deliverables"
                value={deliverables}
                onChange={(event) => setDeliverables(event.target.value)}
                placeholder={'Design system\nResponsive frontend\nAdmin dashboard'}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Milestones</h2>
                <Button type="button" variant="outline" onClick={addMilestone}>
                  Add milestone
                </Button>
              </div>

              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <Card key={index} className="border border-border/60 bg-muted/20">
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Milestone title</Label>
                          <Input
                            value={milestone.title}
                            onChange={(event) => updateMilestone(index, { title: event.target.value })}
                            placeholder={`Milestone ${index + 1}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Due date</Label>
                          <Input
                            type="date"
                            value={milestone.dueDate}
                            onChange={(event) => updateMilestone(index, { dueDate: event.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Milestone deliverables (one per line)</Label>
                        <Textarea
                          value={milestone.deliverables}
                          onChange={(event) =>
                            updateMilestone(index, { deliverables: event.target.value })
                          }
                          placeholder={'Wireframes\nAPI implementation\nQA pass'}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal-status">Status</Label>
              <select
                id="proposal-status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value as 'draft' | 'sent')}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </select>
            </div>

            {error && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => router.push('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Proposal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}