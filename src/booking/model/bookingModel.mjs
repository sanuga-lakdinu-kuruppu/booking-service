import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
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
    expiryAt: {
      type: Date,
      default: Date.now,
    },
    commuter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commuter",
      required: true,
    },
    trip: {
      tripId: {
        type: Number,
      },
      tripNumber: {
        type: String,
        maxlength: 50,
        trim: true,
      },
      tripDate: {
        type: Date,
        default: Date.now,
      },
      startLocation: {
        stationId: {
          type: Number,
        },
        name: {
          type: String,
          trim: true,
          minlength: 1,
          maxlength: 50,
        },
        coordinates: {
          lat: {
            type: Number,
            min: -90,
            max: 90,
          },
          log: {
            type: Number,
            min: -180,
            max: 180,
          },
        },
      },
      endLocation: {
        stationId: {
          type: Number,
        },
        name: {
          type: String,
          trim: true,
          minlength: 1,
          maxlength: 50,
        },
        coordinates: {
          lat: {
            type: Number,
            min: -90,
            max: 90,
          },
          log: {
            type: Number,
            min: -180,
            max: 180,
          },
        },
      },
      route: {
        routeId: {
          type: Number,
        },
        routeNumber: {
          type: String,
          maxLength: 50,
        },
        routeName: {
          type: String,
          trim: true,
          minlength: 1,
          maxlength: 50,
        },
        travelDistance: {
          type: String,
          maxlength: 10,
        },
        travelDuration: {
          type: String,
          maxlength: 10,
        },
      },
      schedule: {
        scheduleId: {
          type: Number,
        },
        departureTime: {
          type: String,
          trim: true,
        },
        arrivalTime: {
          type: String,
          trim: true,
        },
      },
      vehicle: {
        vehicleId: {
          type: Number,
        },
        registrationNumber: {
          type: String,
          trim: true,
          maxLength: 50,
        },
        model: {
          type: String,
          trim: true,
          maxlength: 50,
        },
        capacity: {
          type: Number,
          max: 200,
          min: 1,
        },
        type: {
          type: String,
          maxlength: 20,
          trim: true,
        },
        airCondition: {
          type: Boolean,
          default: false,
        },
        adjustableSeats: {
          type: Boolean,
          default: false,
        },
        chargingCapability: {
          type: Boolean,
          default: false,
        },
        restStops: {
          type: Boolean,
          default: false,
        },
        movie: {
          type: Boolean,
          default: false,
        },
        music: {
          type: Boolean,
          default: false,
        },
        cupHolder: {
          type: Boolean,
          default: false,
        },
        emergencyExit: {
          type: Boolean,
          default: false,
        },
      },
      cancellationPolicy: {
        policyId: {
          type: Number,
        },
        policyName: {
          type: String,
          trim: true,
          minlength: 1,
          maxlength: 50,
        },
        type: {
          type: String,
          trim: true,
          minlength: 1,
          maxlength: 20,
        },
        description: {
          type: String,
          maxlength: 1000,
        },
      },
    },
    seatNumber: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
    },
    eTicket: {
      type: String,
      trim: true,
    },
    qrValidationToken: {
      type: String,
      trim: true,
    },
    backedUpStatus: {
      type: String,
      required: true,
      maxlength: 20,
      trim: true,
    },
    bookingStatus: {
      type: String,
      required: true,
      maxlength: 20,
      trim: true,
    },
    ticketStatus: {
      type: String,
      required: true,
      maxlength: 20,
      trim: true,
    },
    cancelledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model("Booking", bookingSchema);
