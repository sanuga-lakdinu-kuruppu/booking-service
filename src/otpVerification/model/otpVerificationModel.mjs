import mongoose from "mongoose";

const optVerificationSchema = new mongoose.Schema(
  {
    verificationId: {
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
    otp: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4,
      minlength: 4,
    },
    expiryAt: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

optVerificationSchema.index({ expiryAt: 1 }, { expireAfterSeconds: 0 });

export const OtpVerification = mongoose.model(
  "OtpVerification",
  optVerificationSchema
);
