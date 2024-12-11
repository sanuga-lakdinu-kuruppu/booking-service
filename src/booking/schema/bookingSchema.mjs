import { Commuter } from "../../commuter/model/commuterModel.mjs";
import { TripCapacity } from "../../tripCapacity/model/tripCapacityModel.mjs";

export const bookingSchema = {
  commuter: {
    notEmpty: {
      errorMessage: "commuter is required",
    },
    isNumeric: {
      errorMessage: "commuter should be a number",
    },
    custom: {
      options: async (value, { request }) => {
        const commuter = await Commuter.findOne({ commuterId: value });
        if (!commuter) {
          throw new Error("commuter does not exist in the database");
        }
        return true;
      },
    },
  },
  trip: {
    notEmpty: {
      errorMessage: "trip is required",
    },
    isNumeric: {
      errorMessage: "trip should be a number",
    },
    custom: {
      options: async (value, { request }) => {
        const tripCapacity = await TripCapacity.findOne({ tripId: value });
        if (!tripCapacity) {
          throw new Error("trip does not exist in the database");
        }
        return true;
      },
    },
  },
  seatNumber: {
    notEmpty: {
      errorMessage: "seatNumber is required",
    },
    isNumeric: {
      errorMessage: "seatNumber should be a number",
    },
  },
};
