import mongoose from "mongoose";

const paymentRequestSchema = new mongoose.Schema(
  {
    requestId: {
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
    redirectUrl: {
      type: String,
      trim: true,
    },
    callbackUrl: {
      type: String,
      trim: true,
    },
    gatewayTransactionId: {
      type: String,
      trim: true,
    },
    systemTransactionId: {
      type: String,
      trim: true,
    },
    bookingPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookingPayment",
      required: true,
    },
    bookingId: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentRequest = mongoose.model(
  "PaymentRequest",
  paymentRequestSchema
);
