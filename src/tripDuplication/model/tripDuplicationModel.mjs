import mongoose from "mongoose";

const tripDuplicationSchema = new mongoose.Schema(
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
    bookingStatus: {
      type: String,
      trim: true,
    },
    tripDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const TripDuplication = mongoose.model(
  "TripDuplication",
  tripDuplicationSchema
);
