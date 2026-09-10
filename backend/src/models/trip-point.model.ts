import {
  Schema,
  model,
  type InferSchemaType,
  type HydratedDocument,
} from "mongoose";

const tripPointSchema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
  timestamp: { type: Date, required: true },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  speed: { type: Number, default: null },
  accelX: { type: Number, default: null },
  accelY: { type: Number, default: null },
  accelZ: { type: Number, default: null },
});

tripPointSchema.index({ tripId: 1, timestamp: 1 });

export type TripPoint = InferSchemaType<typeof tripPointSchema>;
export type TripPointDocument = HydratedDocument<TripPoint>;

export const TripPointModel = model("TripPoint", tripPointSchema);
