import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'good' | 'caution' | 'poor';

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'text-foreground',
  good: 'text-good',
  caution: 'text-caution',
  poor: 'text-poor',
};

export function StatusList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn('divide-y rounded-lg border bg-card', className)}>{children}</dl>;
}

type StatusRowProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: StatusTone;
};

export function StatusRow({ label, value, detail, tone = 'neutral' }: StatusRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-small text-muted-foreground">{label}</dt>
      <dd className="text-right">
        <span className={cn('text-body font-medium', TONE_CLASS[tone])}>{value}</span>
        {detail && <span className="block text-caption text-muted-foreground">{detail}</span>}
      </dd>
    </div>
  );
}
