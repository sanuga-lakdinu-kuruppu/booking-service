import { Booking } from "../../booking/model/bookingModel.mjs";
import { OtpVerification } from "../../otpVerification/model/otpVerificationModel.mjs";

export const bookingPaymentSchema = {
  booking: {
    notEmpty: {
      errorMessage: "booking is required",
    },
    isNumeric: {
      errorMessage: "booking should be a number",
    },
    custom: {
      options: async (value, { request }) => {
        const booking = await Booking.findOne({ bookingId: value });
        if (!booking) {
          throw new Error("booking does not exist in the database");
        } else if (booking.bookingStatus === "CREATING") {
          throw new Error("this booking is still creating, please pay later");
        } else if (booking.bookingStatus === "CANCELLED") {
          throw new Error("this booking is cancelled.");
        } else if (booking.bookingStatus === "EXPIRED") {
          throw new Error("this booking is already expired");
        } else if (booking.bookingStatus === "PAID") {
          throw new Error("you have already paid for this booking");
        }

        const otpVerification = await OtpVerification.findOne({
          bookingId: value,
          type: "COMMUTER_VERIFICATION",
        });
        if (!otpVerification) {
          throw new Error("booking process is already expired.");
        } else if (otpVerification.status === "NOT_VERIFIED") {
          throw new Error("this commuter is not verified");
        }
        if (otpVerification.status === "VERIFIED") {
          return true;
        } else {
          throw new Error("this commuter is not verified");
        }
      },
    },
  },
};
