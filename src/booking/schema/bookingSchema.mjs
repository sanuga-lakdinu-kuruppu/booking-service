import { Commuter } from "../../commuter/model/commuterModel.mjs";
import { TripDuplication } from "../../tripDuplication/model/tripDuplicationModel.mjs";

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
        const tripDuplication = await TripDuplication.findOne({ tripId: value });
        if (!tripDuplication)
          throw new Error("trip does not exist in the database");
        else if (tripDuplication.bookingStatus !== "ENABLED")
          throw new Error("booking cannot be created for this trip at this time.");
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
