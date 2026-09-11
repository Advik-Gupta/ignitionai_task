"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-reading px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-label uppercase text-muted-foreground">
          Page error
        </p>
        <h1 className="mt-2 text-heading font-semibold">
          This page couldn&rsquo;t be displayed
        </h1>
        <p className="mt-3 text-body text-foreground-secondary">
          It hit an error while rendering. Trying again usually fixes it. If
          you were recording a trip, it&rsquo;s still saved and you can resume
          it from the Record page.
        </p>
        {error.message && (
          <p className="mt-4 rounded-md border bg-card px-3 py-2 font-mono text-caption text-muted-foreground">
            {error.message}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button className="h-11 sm:h-9 sm:px-5" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline" className="h-11 sm:h-9 sm:px-5">
            <Link href="/record">Go to Record</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
