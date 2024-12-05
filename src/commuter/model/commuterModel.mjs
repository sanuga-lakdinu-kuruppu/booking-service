import mongoose from "mongoose";

const commuterSchema = new mongoose.Schema(
  {
    commuterId: {
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
    name: {
      firstName: {
        type: String,
        minlength: 1,
        maxlength: 20,
        trim: true,
        required: true,
      },
      lastName: {
        type: String,
        minlength: 1,
        maxlength: 20,
        trim: true,
        required: true,
      },
    },
    nic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12,
      minlength: 9,
    },
    contact: {
      mobile: {
        type: String,
        minlength: 9,
        maxlength: 12,
        trim: true,
      },
      email: {
        type: String,
        minlength: 10,
        maxlength: 100,
        trim: true,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Commuter = mongoose.model("Commuter", commuterSchema);
