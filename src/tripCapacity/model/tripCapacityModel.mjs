import mongoose from "mongoose";

const tripCapacitySchema = new mongoose.Schema(
  {
    tripId: {
      type: Number,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TripCapacity = mongoose.model("TripCapacity", tripCapacitySchema);
