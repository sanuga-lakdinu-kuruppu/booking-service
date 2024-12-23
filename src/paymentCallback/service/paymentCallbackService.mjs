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
const s3 = new AWS.S3();

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

        const bucketName = "busriya-qr-bucket";
        const qrBase64 = qrUrl.replace(/^data:image\/png;base64,/, ""); // Extract the base64 part
        const qrImageUrl = await uploadToS3(qrBase64, bucketName);

        const emailTicket = getEmailBodyForETicketAndQR(
          commuter.name.firstName,
          savedBooking.bookingId,
          qrImageUrl,
          eTicket
        );
        await sendEmail(
          commuter.contact.email.trim(),
          emailTicket,
          "E-Ticket and QR Code"
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

const sendEmail = async (toEmail, emailBody, subject) => {
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
          Data: emailBody,
        },
      },
    },
  };

  const emailResponse = await ses.sendEmail(params).promise();
};

const uploadToS3 = async (base64Image, bucketName) => {
  const buffer = Buffer.from(base64Image, "base64");
  const key = `qr-codes/${uuidv4()}.png`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: "image/png",
    ACL: "public-read", // Make the file publicly accessible
  };

  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location; // URL of the uploaded image
};

const filterCallback = (callback) => ({
  callbackId: callback.callbackId,
  createdAt: callback.createdAt,
  updatedAt: callback.updatedAt,
  status: callback.status,
  details: callback.details,
});
