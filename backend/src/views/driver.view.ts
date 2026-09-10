export type LeaderboardRow = {
  driverName: string;
  averageScore: number;
  bestScore: number;
  tripCount: number;
  lastTripAt: Date;
};

export function serializeLeaderboard(rows: LeaderboardRow[]) {
  return rows.map((row, index) => ({
    rank: index + 1,
    driverName: row.driverName,
    averageScore: Math.round(row.averageScore * 10) / 10,
    bestScore: row.bestScore,
    tripCount: row.tripCount,
    lastTripAt: row.lastTripAt.toISOString(),
  }));
}
