import type { Metadata } from 'next';
import { AppHeader } from '@/components/app-header';
import { TripRecorder } from '@/components/record/trip-recorder';

export const metadata: Metadata = {
  title: 'Record a trip · Driver Scorecard',
};

export default function RecordPage() {
  return (
    <>
      <AppHeader />
      <main>
        <TripRecorder />
      </main>
    </>
  );
}
