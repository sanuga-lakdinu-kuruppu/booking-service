import { BookingPayment } from "../../bookingPayment/model/bookingPaymentModel.mjs";
import { PaymentCallback } from "../../paymentCallback/model/paymentCallbackModel.mjs";
import { PaymentRequest } from "../../paymentRequest/model/paymentRequestModel.mjs";
import { Booking } from "../../booking/model/bookingModel.mjs";
import { generateQrString, generateTicket } from "../../common/util/unique.mjs";
import {
  getEmailBodyForPaymentSuccess,
  getEmailBodyForETicketAndQR,
} from "../../common/util/emailTemplate.mjs";
import { Commuter } from "../../commuter/model/commuterModel.mjs";
import AWS from "aws-sdk";
const ses = new AWS.SES();
import { Buffer } from "buffer";

const eventBridge = new AWS.EventBridge({
  region: process.env.FINAL_AWS_REGION,
});

export const createNewCallback = async (callback) => {
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

  if (savedCallback.status === "SUCCESS") {
    const updatedBookingPayment = {
      status: "SUCCESS",
    };
    const bookingPaymentUpdated = await BookingPayment.findOneAndUpdate(
      { _id: paymentRequest.bookingPayment },
      updatedBookingPayment,
      {
        new: true,
        runValidators: true,
      }
    );

    if (bookingPaymentUpdated.type === "BOOKING") {
      const eTicket = generateTicket();
      const qrUrl = await generateQrString(eTicket);

      const updatedBooking = {
        bookingStatus: "PAID",
        eTicket: eTicket,
        qrValidationToken: qrUrl,
      };

      const savedBooking = await Booking.findOneAndUpdate(
        { bookingId: paymentRequest.bookingId },
        updatedBooking,
        {
          new: true,
          runValidators: true,
        }
      );
      await triggerPaymentSuccessEvent(
        savedBooking.trip.tripId,
        savedBooking.seatNumber
      );

      const commuter = await Commuter.findById(savedBooking.commuter);
      if (commuter) {
        const emailSucess = getEmailBodyForPaymentSuccess(
          commuter.name.firstName,
          savedBooking.bookingId,
          savedBooking.trip,
          savedBooking.seatNumber,
          savedBooking.price
        );
        // await sendEmail(
        //   commuter.contact.email.trim(),
        //   emailSucess,
        //   "Payment Successful - Booking Confirmation"
        // );

        const emailTicket = getEmailBodyForETicketAndQR(
          commuter.name.firstName,
          savedBooking.bookingId,
          qrUrl,
          eTicket
        );
        await sendEmail(
          commuter.contact.email.trim(),
          emailTicket,
          "E-Ticket and QR Code",
          qrUrl
        );
      }
    }
  } else {
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
  }
  const returnObj = {
    ...filterCallback(savedCallback),
    paymentRequest: {
      transactionId: paymentRequest.gatewayTransactionId,
    },
  };
  return returnObj;
};

const triggerPaymentSuccessEvent = async (tripId, seatNumber) => {
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
};

const sendEmail = async (toEmail, emailBody, subject, qrBase64) => {
  const qrBuffer = Buffer.from(qrBase64.split(",")[1], "base64");
  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Html: {
          Data: emailBody.replace(
            "{QR_CODE}",
            '<img src="cid:qrCodeImage" alt="QR Code" />'
          ),
        },
      },
    },
    Attachments: [
      {
        Content: qrBuffer, // Binary content of the QR code
        ContentType: "image/png",
        Name: "qrcode.png", // Name of the attachment
        ContentId: "qrCodeImage", // Content-ID for referencing in the email body
      },
    ],
  };

  const emailResponse = await ses.sendEmail(params).promise();
};

const filterCallback = (callback) => ({
  callbackId: callback.callbackId,
  createdAt: callback.createdAt,
  updatedAt: callback.updatedAt,
  status: callback.status,
  details: callback.details,
});
