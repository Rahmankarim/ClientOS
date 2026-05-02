'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ProposalResponse = {
  _id: string;
  clientName: string;
  clientEmail: string;
  title: string;
  deliverables: string[];
  milestones: Array<{
    title: string;
    dueDate: string;
    deliverables: string[];
  }>;
  status: 'draft' | 'sent' | 'approved';
  createdAt: string;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load proposal');
  }

  return payload as ProposalResponse;
};

export default function ProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const proposalId = params?.id;
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR(
    proposalId ? `/api/proposals/${proposalId}` : null,
    fetcher
  );

  const [isApproving, setIsApproving] = useState(false);
  const [approveMessage, setApproveMessage] = useState('');
  const [approveError, setApproveError] = useState('');

  async function handleApprove() {
    if (!proposalId) {
      return;
    }

    setApproveMessage('');
    setApproveError('');
    setIsApproving(true);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: 'PUT',
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to approve proposal');
      }

      setApproveMessage(payload.message || 'Proposal approved. Project created successfully.');
      await mutate();

      if (payload.projectId) {
        router.push(`/dashboard/projects/${payload.projectId}`);
      }
    } catch (approvalError) {
      setApproveError(
        approvalError instanceof Error ? approvalError.message : 'Unable to approve proposal'
      );
    } finally {
      setIsApproving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-72 animate-pulse rounded bg-muted" />
          <div className="h-5 w-96 animate-pulse rounded bg-muted" />
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load proposal</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : 'Please try again.'}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="cosmic-panel lift-in space-y-3 rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <Badge variant={data.status === 'approved' ? 'default' : 'secondary'}>{data.status}</Badge>
        </div>
        <p className="text-muted-foreground">
          Proposal for {data.clientName} ({data.clientEmail})
        </p>
      </header>

      <Card className="cosmic-panel">
        <CardHeader>
          <CardTitle>Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          {data.deliverables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deliverables added.</p>
          ) : (
            <ul className="list-inside list-disc space-y-2 text-sm">
              {data.deliverables.map((deliverable) => (
                <li key={deliverable}>{deliverable}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="cosmic-panel">
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones defined.</p>
          ) : (
            data.milestones.map((milestone, index) => (
              <div key={`${milestone.title}-${index}`} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{milestone.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
                {milestone.deliverables.length > 0 && (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {milestone.deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="cosmic-panel">
        <CardHeader>
          <CardTitle>Approval</CardTitle>
          <CardDescription>
            Approving this proposal will create a live project and pre-populate milestones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.status !== 'approved' ? (
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving ? 'Approving...' : 'Approve Proposal'}
            </Button>
          ) : (
            <p className="text-sm text-emerald-600 dark:text-emerald-300">
              This proposal is already approved.
            </p>
          )}

          {approveMessage && (
            <p className="text-sm text-emerald-600 dark:text-emerald-300">{approveMessage}</p>
          )}
          {approveError && <p className="text-sm text-red-600 dark:text-red-300">{approveError}</p>}
        </CardContent>
      </Card>
    </main>
  );
}