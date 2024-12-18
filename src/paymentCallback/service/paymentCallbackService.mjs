import { BookingPayment } from "../../bookingPayment/model/bookingPaymentModel.mjs";
import { PaymentCallback } from "../../paymentCallback/model/paymentCallbackModel.mjs";
import { PaymentRequest } from "../../paymentRequest/model/paymentRequestModel.mjs";
import { Booking } from "../../booking/model/bookingModel.mjs";
import AWS from "aws-sdk";

const eventBridge = new AWS.EventBridge({
  region: process.env.FINAL_AWS_REGION,
});

export const createNewCallback = async (callback) => {
  try {
    const paymentRequest = await PaymentRequest.findOne({
      systemTransactionId: callback.systemTransactionId,
      gatewayTransactionId: callback.transactionId,
    });
    if (!paymentRequest) return null;

    const newData = {
      callbackId: callback.callbackId,
      paymentRequest: paymentRequest._id,
      status: callback.status,
      details: callback.details,
    };

    const newCallback = new PaymentCallback(newData);
    const savedCallback = await newCallback.save();
    console.log(`payment callback saved successfully :)`);

    if (savedCallback.status === "SUCCESS") {
      console.log(`payment success callback :)`);
      const updatedBookingPayment = {
        status: "SUCCESS",
      };
      await BookingPayment.findOneAndUpdate(
        { _id: paymentRequest.bookingPayment },
        updatedBookingPayment,
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(`booking payment updated successfully :)`);

      const updatedBooking = {
        bookingStatus: "PAID",
      };

      const savedBooking = await Booking.findOneAndUpdate(
        { bookingId: paymentRequest.bookingId },
        updatedBooking,
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(`booking updated successfully :)`);
      await triggerPaymentSuccessEvent(
        savedBooking.trip.tripId,
        savedBooking.seatNumber
      );
    } else {
      console.log(`payment failed callback :)`);
      const updatedBookingPayment = {
        status: "FAILED",
      };
      await BookingPayment.findOneAndUpdate(
        { _id: paymentRequest.bookingPayment },
        updatedBookingPayment,
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(`booking payment updated successfully :)`);
    }
    const returnObj = {
      ...filterCallback(savedCallback),
      paymentRequest: {
        transactionId: paymentRequest.gatewayTransactionId,
      },
    };
    return returnObj;
  } catch (error) {
    console.log(`callback creation error ${error}`);
    return null;
  }
};

const triggerPaymentSuccessEvent = async (tripId, seatNumber) => {
  try {
    const eventParams = {
      Entries: [
        {
          Source: "booking-service",
          DetailType: "TRIP_SUPPORT_SERVICE",
          Detail: JSON.stringify({
            internalEventType: "EVN_BOOKING_PAYMENT_SUCCESS",
            tripId: tripId,
            seatNumber: seatNumber,
          }),
          EventBusName: "busriya.com_event_bus",
        },
      ],
    };
    await eventBridge.putEvents(eventParams).promise();
  } catch (error) {
    console.log(`payment success event triggering error ${error}`);
  }
};

const filterCallback = (callback) => ({
  callbackId: callback.callbackId,
  createdAt: callback.createdAt,
  updatedAt: callback.updatedAt,
  status: callback.status,
  details: callback.details,
});
