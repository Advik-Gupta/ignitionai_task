import mongoose from "mongoose";
import { connectToDatabase } from "../config/database";
import { env } from "../config/env";
import { resetSampleTrips } from "../services/sample-data.service";

async function seed() {
  await connectToDatabase(env.mongoUri);

  const { removed, inserted } = await resetSampleTrips();
  if (removed > 0) {
    console.log(`Removed ${removed} previous sample trips`);
  }

  for (const trip of inserted) {
    const counts = Object.entries(trip.eventCounts)
      .map(([type, count]) => `${type}=${count}`)
      .join(" ");
    console.log(
      `${trip.driverName.padEnd(6)} ${trip.startTime.toLocaleString()}  score ${String(trip.score).padStart(3)}  ${counts}`,
    );
  }

  console.log(`Inserted ${inserted.length} sample trips`);
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
