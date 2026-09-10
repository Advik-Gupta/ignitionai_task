import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Leaderboard } from "@/components/leaderboard/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · Driver Scorecard",
};

export default function LeaderboardPage() {
  return (
    <>
      <AppHeader />
      <main>
        <Leaderboard />
      </main>
    </>
  );
}
