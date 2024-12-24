import mongoose from "mongoose";

const lostParcelSchema = new mongoose.Schema(
  {
    parcelId: {
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
    eTicket: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      maxlength: 20,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    commuter: {
      commuterId: {
        type: Number,
      },
      name: {
        firstName: {
          type: String,
          trim: true,
        },
        lastName: {
          type: String,
          trim: true,
        },
      },
      nic: {
        type: String,
        trim: true,
      },
      contact: {
        mobile: {
          type: String,
          trim: true,
        },
        email: {
          type: String,
          trim: true,
        },
      },
    },
    takeAwayStation: {
      stationId: {
        type: Number,
      },
      name: {
        type: String,
      },
    },
    handedOverAt: {
      type: Date,
    },
    handedOverPerson: {
      firstName: {
        type: String,
      },
      lastName: {
        type: String,
      },
      nic: {
        type: String,
      },
    },
    bookingId: {
      type: Number,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LostParcel = mongoose.model("LostParcel", lostParcelSchema);
