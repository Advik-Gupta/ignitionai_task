'use client';

import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatElapsed, pluralize } from '@/lib/format';
import type { Trip } from '@/lib/trip-api';
import { StatusList, StatusRow } from './status-list';

type FinishedPanelProps = {
  trip: Trip;
  onRecordAnother: () => void;
};

export function FinishedPanel({ trip, onRecordAnother }: FinishedPanelProps) {
  return (
    <div className="mx-auto flex max-w-reading flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12">
      <div>
        <p className="text-label uppercase text-good">Trip saved</p>
        <h1 className="mt-2 text-heading font-semibold">
          {formatElapsed(trip.durationSeconds ?? 0)} on the road
        </h1>
      </div>

      {trip.rawPointCount === 0 && (
        <Alert>
          <TriangleAlert className="text-caution" />
          <AlertTitle>No readings were recorded</AlertTitle>
          <AlertDescription>
            The trip was saved, but no GPS fix came through while it was running, so there&rsquo;s nothing to
            score. This usually means the signal was lost for the whole trip.
          </AlertDescription>
        </Alert>
      )}

      <StatusList>
        <StatusRow label="Started" value={formatDateTime(trip.startTime)} />
        <StatusRow label="Ended" value={trip.endTime ? formatDateTime(trip.endTime) : '-'} />
        <StatusRow label="Readings" value={pluralize(trip.rawPointCount, 'reading')} />
      </StatusList>

      <Button className="h-11 w-full sm:h-9 sm:w-auto sm:px-5" onClick={onRecordAnother}>
        Record another trip
      </Button>
    </div>
  );
}
