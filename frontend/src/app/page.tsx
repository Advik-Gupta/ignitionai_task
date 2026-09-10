import { AppHeader } from "@/components/app-header";
import { BackendStatus } from "@/components/backend-status";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-page px-5 py-8 sm:px-8 sm:py-12">
        <h1 className="max-w-reading text-heading font-semibold">
          Records a drive with your phone&rsquo;s GPS and accelerometer, then
          scores it on braking, cornering, speed and idling.
        </h1>
        <p className="mt-3 max-w-reading text-body text-ink-secondary">
          Nothing is recordable yet - trip capture arrives in a later stage.
          This page confirms the Next.js app can reach the Express API and that
          the API is connected to MongoDB.
        </p>

        <div className="mt-8 max-w-reading">
          <BackendStatus />
        </div>
      </main>
    </>
  );
}
