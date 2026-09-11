import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { RecentActivity } from "@/components/home/recent-activity";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-page px-5 py-8 sm:px-8 sm:py-12">
        <section className="max-w-reading">
          <h1 className="text-heading font-semibold">
            Record a drive on your phone and get a safety score for braking,
            cornering, speed and idling.
          </h1>
          <p className="mt-3 text-body text-foreground-secondary">
            Each trip is scored out of 100, with a breakdown of what cost
            points, a tip for next time and the route on a map. It runs in the
            browser, so there&rsquo;s nothing to install.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" className="h-11 sm:h-9 sm:px-5">
              <Link href="/record">Start a trip</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 sm:h-9 sm:px-5"
            >
              <Link href="/trips">View past trips</Link>
            </Button>
          </div>
        </section>

        <div className="mt-12 sm:mt-16">
          <RecentActivity />
        </div>
      </main>
    </>
  );
}
