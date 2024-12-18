import mongoose from "mongoose";

const bookingPaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: Number,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    paymentAt: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const BookingPayment = mongoose.model(
  "BookingPayment",
  bookingPaymentSchema
);
