export const otpVerificationSchema = {
  otp: {
    notEmpty: {
      errorMessage: "otp is required",
    },
    isNumeric: {
      errorMessage: "otp should be a number",
    },
  },
};
