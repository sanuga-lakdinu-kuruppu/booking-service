export const paymentCallbackSchema = {
  transactionId: {
    notEmpty: {
      errorMessage: "transactionId is required",
    },
    isString: {
      errorMessage: "transactionId should be a string",
    },
  },
  systemTransactionId: {
    notEmpty: {
      errorMessage: "systemTransactionId is required",
    },
    isString: {
      errorMessage: "systemTransactionId should be a string",
    },
  },
  status: {
    notEmpty: {
      errorMessage: "status is required",
    },
    isString: {
      errorMessage: "status should be a string",
    },
  },
  details: {
    isString: {
      errorMessage: "details should be a string",
    },
  },
};
