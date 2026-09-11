import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { TripList } from "@/components/trips/trip-list";

export const metadata: Metadata = {
  title: "Trips",
};

export default function TripsPage() {
  return (
    <>
      <AppHeader />
      <main>
        <TripList />
      </main>
    </>
  );
}
