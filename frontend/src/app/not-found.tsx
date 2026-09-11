import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-reading px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-label uppercase text-muted-foreground">404</p>
        <h1 className="mt-2 text-heading font-semibold">
          There&rsquo;s no page at this address
        </h1>
        <p className="mt-3 text-body text-foreground-secondary">
          The link may be mistyped or incomplete. Your trips are still where
          you left them.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="h-11 sm:h-9 sm:px-5">
            <Link href="/trips">Go to trips</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 sm:h-9 sm:px-5">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
