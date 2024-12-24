import { Booking } from "../../booking/model/bookingModel.mjs";

export const lostParcelSchema = {
  eTicket: {
    notEmpty: {
      errorMessage: "eTicket cannot be empty",
    },
    isString: {
      errorMessage: "eTicket must be a string",
    },
    isLength: {
      options: {
        max: 50,
      },
      errorMessage: "eTicket must be less than 50 characters",
    },
    trim: true,
  },
  type: {
    notEmpty: {
      errorMessage: "type cannot be empty",
    },
    isString: {
      errorMessage: "type must be a string",
    },
    isLength: {
      options: {
        max: 20,
      },
      errorMessage: "type must be less than 20 characters",
    },
    trim: true,
  },
  name: {
    notEmpty: {
      errorMessage: "name cannot be empty",
    },
    isString: {
      errorMessage: "name must be a string",
    },
    isLength: {
      options: {
        max: 50,
      },
      errorMessage: "name must be less than 50 characters",
    },
    trim: true,
  },
  description: {
    isString: {
      errorMessage: "description must be a string",
    },
    isLength: {
      options: {
        max: 1000,
      },
      errorMessage: "description must be less than 1000 characters",
    },
    trim: true,
  },
};
