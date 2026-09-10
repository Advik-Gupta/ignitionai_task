'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { API_BASE_URL, apiFetch } from '@/lib/api';

type HealthResponse = {
  status: string;
  database: string;
  uptimeSeconds: number;
  timestamp: string;
};

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; health: HealthResponse }
  | { kind: 'error'; message: string };

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function BackendStatus() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const check = useCallback(async () => {
    try {
      const health = await apiFetch<HealthResponse>('/api/health');
      setState({ kind: 'ready', health });
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const recheck = () => {
    setState({ kind: 'loading' });
    void check();
  };

  const dbConnected = state.kind === 'ready' && state.health.database === 'connected';

  return (
    <section className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="text-section font-semibold">Backend connection</h2>
        <Button variant="outline" size="sm" onClick={recheck} disabled={state.kind === 'loading'}>
          {state.kind === 'loading' ? 'Checking…' : 'Check again'}
        </Button>
      </div>

      <dl className="divide-y">
        <Row label="API base URL">
          <span className="font-mono text-small break-all text-foreground-secondary">{API_BASE_URL}</span>
        </Row>

        <Row label="API">
          {state.kind === 'loading' ? (
            <Skeleton className="h-4 w-28" />
          ) : state.kind === 'error' ? (
            <span className="text-poor">Unreachable</span>
          ) : (
            <span className="text-good">Responding, {state.health.status}</span>
          )}
        </Row>

        <Row label="MongoDB">
          {state.kind === 'loading' ? (
            <Skeleton className="h-4 w-28" />
          ) : state.kind === 'error' ? (
            <span className="text-muted-foreground">Unknown</span>
          ) : (
            <span className={dbConnected ? 'text-good' : 'text-caution'}>{state.health.database}</span>
          )}
        </Row>

        <Row label="Server uptime">
          {state.kind === 'ready' ? (
            <span className="font-mono text-small text-foreground-secondary">
              {formatUptime(state.health.uptimeSeconds)}
            </span>
          ) : state.kind === 'loading' ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </Row>
      </dl>

      {state.kind === 'error' && (
        <p className="border-t px-5 py-4 text-small text-foreground-secondary">
          {state.message}. Start the API with <code className="font-mono text-foreground">npm run dev</code> inside{' '}
          <code className="font-mono text-foreground">/backend</code>, and confirm it is listening on the URL above.
        </p>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="text-label uppercase text-muted-foreground sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="text-body">{children}</dd>
    </div>
  );
}
