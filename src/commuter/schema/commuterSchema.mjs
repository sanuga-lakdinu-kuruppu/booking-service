import { Commuter } from "../model/commuterModel.mjs";

export const commuterSchema = {
  "name.firstName": {
    notEmpty: {
      errorMessage: "firstName cannot be empty",
    },
    isString: {
      errorMessage: "firstName must be a string",
    },
    isLength: {
      options: {
        min: 1,
        max: 20,
      },
      errorMessage: "firstName must be between 1 and 20 characters",
    },
    trim: true,
  },
  "name.lastName": {
    notEmpty: {
      errorMessage: "lastName cannot be empty",
    },
    isString: {
      errorMessage: "lastName must be a string",
    },
    isLength: {
      options: {
        min: 1,
        max: 20,
      },
      errorMessage: "lastName must be between 1 and 20 characters",
    },
    trim: true,
  },
  nic: {
    notEmpty: {
      errorMessage: "nic cannot be empty",
    },
    isString: {
      errorMessage: "nic must be a string",
    },
    isLength: {
      options: {
        min: 9,
        max: 12,
      },
      errorMessage: "nic must be between 9 and 12 characters",
    },
    matches: {
      options: [/^(?:\d{9}[vVxX]|\d{12})$/],
      errorMessage:
        "nic must be a valid Sri Lankan NIC in the format '123456789V' or '200012345678'",
    },
    trim: true,
  },
  "contact.mobile": {
    isString: {
      errorMessage: "mobile must be a string",
    },
    matches: {
      options: [/^\+94\d{9}$/],
      errorMessage:
        "mobile must be a valid Sri Lankan mobile number starting with +94 followed by 9 digits",
    },
    trim: true,
  },
  "contact.email": {
    notEmpty: {
      errorMessage: "email cannot be empty",
    },
    isString: {
      errorMessage: "email must be a string",
    },
    isLength: {
      options: {
        min: 10,
        max: 100,
      },
      errorMessage: "email must be between 10 and 100 characters",
    },
    isEmail: {
      errorMessage: "email must be a valid email address",
    },
    trim: true,
  },
};
