import type { Metadata } from 'next';
import { AppHeader } from '@/components/app-header';
import { TripRecorder } from '@/components/record/trip-recorder';

export const metadata: Metadata = {
  title: "Record a trip",
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
