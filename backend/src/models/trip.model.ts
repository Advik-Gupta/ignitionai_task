import {
  Schema,
  model,
  type InferSchemaType,
  type HydratedDocument,
} from "mongoose";

export const TRIP_STATUSES = ["active", "completed"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

const tripSchema = new Schema(
  {
    startTime: { type: Date, required: true, default: () => new Date() },
    endTime: { type: Date, default: null },
    status: {
      type: String,
      enum: TRIP_STATUSES,
      required: true,
      default: "active",
    },
    rawPointCount: { type: Number, required: true, default: 0, min: 0 },
    distanceMeters: { type: Number, default: null, min: 0 },
    score: { type: Number, default: null, min: 0, max: 100 },
  },
  { timestamps: true },
);

tripSchema.index({ startTime: -1 });

export type Trip = InferSchemaType<typeof tripSchema>;
export type TripDocument = HydratedDocument<Trip>;

export const TripModel = model("Trip", tripSchema);
