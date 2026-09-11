"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { seedSampleData, type SeedResult } from "@/lib/trip-api";
import { cn } from "@/lib/utils";

type SeedStatus =
  | { kind: "idle" }
  | { kind: "seeding" }
  | { kind: "error"; message: string };

type SeedSampleDataButtonProps = {
  onSeeded: (result: SeedResult) => void;
  confirmFirst?: boolean;
  label?: string;
  variant?: "default" | "outline";
  className?: string;
  buttonClassName?: string;
};

export function SeedSampleDataButton({
  onSeeded,
  confirmFirst = true,
  label = "Reset sample data",
  variant = "outline",
  className,
  buttonClassName,
}: SeedSampleDataButtonProps) {
  const [status, setStatus] = useState<SeedStatus>({ kind: "idle" });
  const seeding = status.kind === "seeding";

  const seed = async () => {
    setStatus({ kind: "seeding" });
    try {
      const result = await seedSampleData();
      setStatus({ kind: "idle" });
      onSeeded(result);
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "The sample trips couldn't be generated.",
      });
    }
  };

  const button = (
    <Button
      variant={variant}
      className={buttonClassName}
      disabled={seeding}
      onClick={confirmFirst ? undefined : () => void seed()}
    >
      {seeding ? "Generating trips…" : label}
    </Button>
  );

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {confirmFirst ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset the sample trips?</AlertDialogTitle>
              <AlertDialogDescription>
                The current sample trips are deleted and a fresh week of
                simulated drives for Meera, Aarav and Kabir is generated. Trips
                recorded on a phone aren&rsquo;t touched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void seed()}>
                Reset sample data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        button
      )}
      {status.kind === "error" && (
        <p role="alert" className="text-caption text-poor">
          {status.message}
        </p>
      )}
    </div>
  );
}
