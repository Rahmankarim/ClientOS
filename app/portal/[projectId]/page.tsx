'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type PortalMilestoneFeedback = {
  id: string;
  message: string;
  createdAt: string;
};

type PortalMilestone = {
  id: string;
  title: string;
  dueDate: string | null;
  status: 'pending' | 'in progress' | 'completed';
  order: number;
  feedback: PortalMilestoneFeedback[];
};

type PortalActivityItem = {
  id: string;
  type: 'commit' | 'manual' | 'ai_update';
  content: string;
  createdAt: string;
};

type PortalDeliverable = {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
};

type PortalResponse = {
  project: {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'review' | 'completed';
    deadline: string | null;
    clientName: string;
    progressPercent: number;
  };
  milestones: PortalMilestone[];
  activityFeed: PortalActivityItem[];
  deliverables: PortalDeliverable[];
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load portal data');
  }

  return payload as PortalResponse;
};

function milestoneStatusVariant(status: PortalMilestone['status']) {
  if (status === 'completed') {
    return 'default';
  }
  if (status === 'in progress') {
    return 'secondary';
  }
  return 'outline';
}

export default function ClientPortalPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const { data, error, isLoading, mutate } = useSWR(
    projectId ? `/api/portal/${projectId}` : null,
    fetcher
  );

  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  const [sendingFeedbackFor, setSendingFeedbackFor] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string>('');

  const milestoneCount = data?.milestones.length || 0;
  const completedCount = useMemo(
    () => data?.milestones.filter((milestone) => milestone.status === 'completed').length || 0,
    [data?.milestones]
  );

  async function submitFeedback(milestoneId: string) {
    const message = feedbackDraft[milestoneId]?.trim();
    if (!message || !projectId) {
      return;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setSendingFeedbackFor(milestoneId);

    try {
      const response = await fetch(`/api/portal/${projectId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, message }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to submit feedback');
      }

      setFeedbackDraft((current) => ({ ...current, [milestoneId]: '' }));
      setFeedbackSuccess('Feedback sent. Your agency team will see this update.');
      await mutate();
    } catch (submitError) {
      setFeedbackError(submitError instanceof Error ? submitError.message : 'Unable to submit feedback');
    } finally {
      setSendingFeedbackFor(null);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
          <div className="h-36 animate-pulse rounded-xl bg-muted" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load project portal</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : 'Please try again later.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => mutate()}>Retry</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="cosmic-panel lift-in space-y-4 rounded-2xl p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{data.project.name}</h1>
          <Badge variant={data.project.status === 'completed' ? 'default' : 'secondary'}>
            {data.project.status}
          </Badge>
        </div>
        <p className="max-w-3xl text-muted-foreground">{data.project.description}</p>
      </header>

      <Card className="cosmic-panel">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Project Overview</CardTitle>
            <div className="text-sm text-muted-foreground">
              Deadline:{' '}
              {data.project.deadline ? new Date(data.project.deadline).toLocaleDateString() : 'Not set'}
            </div>
          </div>
          <CardDescription>
            {completedCount} of {milestoneCount} milestones completed ({data.project.progressPercent}%)
          </CardDescription>
          <Progress value={data.project.progressPercent} />
        </CardHeader>
      </Card>

      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          {data.milestones.length === 0 ? (
            <Card className="cosmic-panel">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No milestones published yet.
              </CardContent>
            </Card>
          ) : (
            data.milestones.map((milestone) => (
              <Card key={milestone.id} className="cosmic-panel">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">{milestone.title}</CardTitle>
                    <Badge variant={milestoneStatusVariant(milestone.status)}>{milestone.status}</Badge>
                  </div>
                  <CardDescription>
                    Due:{' '}
                    {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No due date'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`feedback-${milestone.id}`}>Feedback for this milestone</Label>
                    <Textarea
                      id={`feedback-${milestone.id}`}
                      placeholder="Share feedback, questions, or approvals..."
                      value={feedbackDraft[milestone.id] || ''}
                      onChange={(event) =>
                        setFeedbackDraft((current) => ({
                          ...current,
                          [milestone.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      onClick={() => submitFeedback(milestone.id)}
                      disabled={sendingFeedbackFor === milestone.id || !(feedbackDraft[milestone.id] || '').trim()}
                    >
                      {sendingFeedbackFor === milestone.id ? 'Sending...' : 'Submit feedback'}
                    </Button>
                  </div>

                  {milestone.feedback.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <p className="text-sm font-medium text-foreground">Previous feedback</p>
                      <div className="space-y-2">
                        {milestone.feedback.map((entry) => (
                          <div key={entry.id} className="rounded-md bg-muted/40 p-2 text-sm">
                            <p className="text-foreground">{entry.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {data.activityFeed.length === 0 ? (
            <Card className="cosmic-panel">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No activity updates yet.
              </CardContent>
            </Card>
          ) : (
            data.activityFeed.map((item) => (
              <Card key={item.id} className="cosmic-panel">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-foreground">{item.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-4">
          {data.deliverables.length === 0 ? (
            <Card className="cosmic-panel">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No deliverables have been published yet.
              </CardContent>
            </Card>
          ) : (
            data.deliverables.map((deliverable) => (
              <Card key={deliverable.id} className="cosmic-panel">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-medium text-foreground">{deliverable.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(deliverable.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <a href={deliverable.url} target="_blank" rel="noreferrer">
                      Open file
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {(feedbackError || feedbackSuccess) && (
        <Card className={feedbackError ? 'border-red-500/40' : 'border-emerald-500/40'}>
          <CardContent className={feedbackError ? 'pt-6 text-sm text-red-600 dark:text-red-300' : 'pt-6 text-sm text-emerald-600 dark:text-emerald-300'}>
            {feedbackError || feedbackSuccess}
          </CardContent>
        </Card>
      )}
    </main>
  );
}