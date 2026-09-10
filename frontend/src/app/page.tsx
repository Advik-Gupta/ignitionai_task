import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { BackendStatus } from '@/components/backend-status';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-page px-5 py-8 sm:px-8 sm:py-12">
        <div className="max-w-reading">
          <h1 className="text-heading font-semibold">
            Records a drive with your phone&rsquo;s GPS and accelerometer, then scores it on braking,
            cornering, speed and idling.
          </h1>
          <p className="mt-3 text-body text-foreground-secondary">
            Open this page on your phone, mount it in the car, and start recording before you pull away.
          </p>
          <Button asChild size="lg" className="mt-6 h-11 w-full sm:h-9 sm:w-auto sm:px-5">
            <Link href="/record">Record a trip</Link>
          </Button>
        </div>

        <div className="mt-12 max-w-reading">
          <BackendStatus />
        </div>
      </main>
    </>
  );
}
