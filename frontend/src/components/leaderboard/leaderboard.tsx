"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreBadge } from "@/components/trips/trip-score";
import { useApiResource } from "@/hooks/use-api-resource";
import { useDriverName } from "@/hooks/use-driver-name";
import { formatShortDate, pluralize } from "@/lib/format";
import { scoreBand } from "@/lib/score";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/trip-api";
import { cn } from "@/lib/utils";

export function Leaderboard() {
  const { state, reload } = useApiResource(getLeaderboard);
  const [storedName] = useDriverName();
  const yourName = storedName.trim().toLowerCase();
  const isYou = (entry: LeaderboardEntry) =>
    yourName.length > 0 && entry.driverName.toLowerCase() === yourName;

  return (
    <div className="mx-auto max-w-page px-5 py-8 sm:px-8 sm:py-12">
      <h1 className="text-heading font-semibold">Leaderboard</h1>
      <p className="mt-1 max-w-reading text-small text-muted-foreground">
        Drivers ranked by their average trip score. Only trips recorded with a
        driver name count.
      </p>

      <div className="mt-8">
        {state.status === "loading" && <LeaderboardSkeleton />}

        {state.status === "error" && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Couldn&rsquo;t load the leaderboard</AlertTitle>
            <AlertDescription>
              <p>
                {state.error instanceof Error
                  ? state.error.message
                  : "The server didn't respond."}{" "}
                Check that the API is running, then try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={reload}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {state.status === "ready" && state.data.length === 0 && (
          <section className="rounded-lg border bg-card px-5 py-10 text-center sm:px-8">
            <h2 className="text-section font-semibold">No named drivers yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-body text-foreground-secondary">
              Enter a driver name on the Record page before starting a trip,
              and it will be ranked here once the trip ends.
            </p>
            <Button asChild className="mt-6 h-11 w-full sm:h-9 sm:w-auto sm:px-5">
              <Link href="/record">Record a trip</Link>
            </Button>
          </section>
        )}

        {state.status === "ready" && state.data.length > 0 && (
          <>
            <div className="hidden rounded-lg border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 px-4 text-right">#</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Average</TableHead>
                    <TableHead className="text-right">Best</TableHead>
                    <TableHead className="text-right">Trips</TableHead>
                    <TableHead className="px-4 text-right">Last trip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.data.map((entry) => (
                    <TableRow
                      key={entry.driverName}
                      className={cn(
                        "hover:bg-transparent",
                        isYou(entry) && "bg-muted/60 hover:bg-muted/60",
                      )}
                    >
                      <TableCell className="px-4 text-right tabular-nums text-muted-foreground">
                        {entry.rank}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.driverName}
                        {isYou(entry) && (
                          <span className="ml-2 text-caption font-normal text-muted-foreground">
                            You
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-semibold tabular-nums">
                            {entry.averageScore}
                          </span>
                          <ScoreBadge band={scoreBand(entry.averageScore)} />
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-foreground-secondary">
                        {entry.bestScore}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-foreground-secondary">
                        {entry.tripCount}
                      </TableCell>
                      <TableCell className="px-4 text-right text-foreground-secondary">
                        {formatShortDate(entry.lastTripAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ol className="divide-y rounded-lg border bg-card md:hidden">
              {state.data.map((entry) => (
                <li
                  key={entry.driverName}
                  className={cn(
                    "flex min-h-16 items-center gap-4 px-4 py-3",
                    isYou(entry) && "bg-muted/60",
                  )}
                >
                  <span className="w-6 shrink-0 text-right text-small tabular-nums text-muted-foreground">
                    {entry.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium">
                      {entry.driverName}
                      {isYou(entry) && (
                        <span className="ml-2 text-caption font-normal text-muted-foreground">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {pluralize(entry.tripCount, "trip")} · best{" "}
                      {entry.bestScore}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-title font-semibold tabular-nums">
                      {entry.averageScore}
                    </span>
                    <ScoreBadge band={scoreBand(entry.averageScore)} />
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div
      className="divide-y rounded-lg border bg-card"
      aria-busy="true"
      aria-label="Loading leaderboard"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}
