import mongoose from "mongoose";

const paymentCallbackSchema = new mongoose.Schema(
  {
    callbackId: {
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
    details: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    paymentRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentRequest",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentCallback = mongoose.model(
  "PaymentCallback",
  paymentCallbackSchema
);
