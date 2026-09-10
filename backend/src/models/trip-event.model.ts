import {
  Schema,
  model,
  type InferSchemaType,
  type HydratedDocument,
} from "mongoose";

export const TRIP_EVENT_TYPES = [
  "harsh_braking",
  "sharp_turn",
  "over_speeding",
  "idle",
] as const;
export type TripEventType = (typeof TRIP_EVENT_TYPES)[number];

const tripEventSchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    type: { type: String, enum: TRIP_EVENT_TYPES, required: true },
    timestamp: { type: Date, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    severity: { type: Number, required: true, min: 0, max: 1 },
    rawValue: { type: Number, required: true },
  },
  { timestamps: true },
);

tripEventSchema.index({ tripId: 1, timestamp: 1 });

export type TripEvent = InferSchemaType<typeof tripEventSchema>;
export type TripEventDocument = HydratedDocument<TripEvent>;

export const TripEventModel = model("TripEvent", tripEventSchema);
