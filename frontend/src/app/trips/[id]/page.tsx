import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { TripDetailView } from "@/components/trips/trip-detail";

export const metadata: Metadata = {
  title: "Trip details",
};

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <AppHeader />
      <main>
        <TripDetailView tripId={id} />
      </main>
    </>
  );
}
