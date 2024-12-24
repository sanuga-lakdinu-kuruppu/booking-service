export const bookingStatusSchema = {
  bookingStatus: {
    notEmpty: {
      errorMessage: "bookingStatus is required",
    },
    isString: {
      errorMessage: "bookingStatus should be a String",
    },
    isIn: {
      options: [["CANCELLED"]],
      errorMessage: "bookingStatus must be CANCELLED",
    },
  },
};
