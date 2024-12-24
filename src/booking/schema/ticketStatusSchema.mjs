export const ticketStatusSchema = {
  ticketStatus: {
    notEmpty: {
      errorMessage: "ticketStatus is required",
    },
    isString: {
      errorMessage: "ticketStatus should be a String",
    },
    isIn: {
      options: [["USED"]],
      errorMessage: "ticketStatus must be USED",
    },
  },
};
