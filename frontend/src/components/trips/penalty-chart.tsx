"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EVENT_LABELS, EVENT_TYPES } from "@/lib/events";
import { pluralize } from "@/lib/format";
import type { EventTypeTotals } from "@/lib/trip-api";

const chartConfig = {
  penalty: { label: "Points lost", color: "var(--chart-bar)" },
} satisfies ChartConfig;

const BAR_THICKNESS = 20;
const CATEGORY_AXIS_WIDTH = 116;

type PenaltyChartProps = {
  penalties: EventTypeTotals;
  counts: EventTypeTotals;
};

function formatPointsLost(value: number): string {
  return value > 0 ? `−${value}` : "0";
}

export function PenaltyChart({ penalties, counts }: PenaltyChartProps) {
  const data = EVENT_TYPES.map((type) => ({
    label: EVENT_LABELS[type],
    penalty: penalties[type],
    count: counts[type],
  }));

  const description = data
    .map((row) => `${row.label} ${formatPointsLost(row.penalty)}`)
    .join(", ");

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-48 w-full"
      role="img"
      aria-label={`Points lost by event type: ${description}`}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 0 }}
        accessibilityLayer
      >
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={CATEGORY_AXIS_WIDTH}
          tickMargin={8}
        />
        <XAxis type="number" dataKey="penalty" domain={[0, "dataMax"]} hide />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-6">
                  <span className="text-muted-foreground">
                    {pluralize(
                      (item.payload as { count: number }).count,
                      "event",
                    )}
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatPointsLost(Number(value))} pts
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="penalty"
          fill="var(--color-penalty)"
          barSize={BAR_THICKNESS}
          radius={[0, 4, 4, 0]}
        >
          <LabelList
            dataKey="penalty"
            position="right"
            offset={8}
            fill="var(--foreground)"
            fontSize={12}
            formatter={(value) => formatPointsLost(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
