import { Commuter } from "../../commuter/model/commuterModel.mjs";
import { Booking } from "../model/bookingModel.mjs";
import { OtpVerification } from "../../otpVerification/model/otpVerificationModel.mjs";
import { TripDuplication } from "../../tripDuplication/model/tripDuplicationModel.mjs";
import AWS from "aws-sdk";
import {
  getEmailBodyForETicketAndQR,
  getEmailBodyForBookingCancellation,
  getEmailBodyForSuccessfulOnboarding,
} from "../../common/util/emailTemplate.mjs";
import {
  SchedulerClient,
  CreateScheduleCommand,
} from "@aws-sdk/client-scheduler";
import { generateShortUuid, generateOtp } from "../../common/util/unique.mjs";
import { getEmailBodyForCommuterVerification } from "../../common/util/emailTemplate.mjs";
const ses = new AWS.SES();

const eventBridge = new AWS.EventBridge({
  region: process.env.FINAL_AWS_REGION,
});

const schedulerClient = new SchedulerClient({
  region: process.env.FINAL_AWS_REGION,
});

export const createNewBooking = async (booking) => {
  const foundTripDuplication = await TripDuplication.findOne({
    tripId: booking.trip,
  });
  if (
    booking.seatNumber < 1 ||
    booking.seatNumber > foundTripDuplication.capacity
  )
    return "SEAT_NOT_IN_THE_VALID_RANGE";

  const foundCommuter = await Commuter.findOne({
    commuterId: booking.commuter,
  });
  const foundBookingForThisSeat = await Booking.findOne({
    seatNumber: booking.seatNumber,
    "trip.tripId": booking.trip,
    bookingStatus: { $in: ["CREATING", "PENDING", "PAID"] },
  });
  if (foundBookingForThisSeat) return "SEAT_IS_ALREADY_USED";

  const bookingWaiting = process.env.OTP_WAITING_BOOKING || 10;

  booking.trip = {
    tripId: booking.trip,
  };
  booking.commuter = foundCommuter._id;
  booking.ticketStatus = "NOT_USED";
  booking.bookingStatus = "CREATING";
  booking.backedUpStatus = "NOT_BACKED_UP";
  booking.expiryAt = new Date(Date.now() + bookingWaiting * 60 * 1000);

  const newBooking = new Booking(booking);
  const savedBooking = await newBooking.save();

  await triggerBookingCreatedEvent(booking);
  await triggerEventForBookingExpiration(
    bookingWaiting,
    booking.bookingId,
    booking.trip.tripId,
    booking.seatNumber
  );

  const otpWaiting = process.env.OTP_WAITING || 10;

  const otp = generateOtp();
  const optVerification = {
    verificationId: generateShortUuid(),
    otp: otp,
    expiryAt: new Date(Date.now() + otpWaiting * 60 * 1000),
    bookingId: savedBooking.bookingId,
    status: "NOT_VERIFIED",
    type: "COMMUTER_VERIFICATION",
  };

  const newOtpVerification = new OtpVerification(optVerification);
  const savedOtpVerification = await newOtpVerification.save();

  const emailBody = getEmailBodyForCommuterVerification(
    otp,
    foundCommuter.name.firstName,
    otpWaiting
  );
  await sendOtpEmail(foundCommuter.contact.email, emailBody);

  const populatedBooking = await Booking.findById(savedBooking._id)
    .select(
      "bookingId trip.tripId commuter createdAt updatedAt seatNumber bookingStatus -_id"
    )
    .populate({
      path: "commuter",
      select: "commuterId name nic contact -_id",
    });
  return filterBookingFields(populatedBooking, optVerification.verificationId);
};

export const getAllBookings = async () => {
  const foundBookings = await Booking.find()
    .select(
      "bookingId trip commuter createdAt updatedAt seatNumber price ticketStatus bookingStatus -_id"
    )
    .populate({
      path: "commuter",
      select: "commuterId name nic contact -_id",
    });
  return foundBookings;
};

export const getBookingById = async (id) => {
  const foundBooking = await Booking.findOne({ bookingId: id })
    .select(
      "bookingId trip commuter createdAt updatedAt seatNumber price ticketStatus bookingStatus -_id"
    )
    .populate({
      path: "commuter",
      select: "commuterId name nic contact -_id",
    });
  return foundBooking;
};

export const getBookingByTripId = async (id) => {
  const foundBookings = await Booking.find({ "trip.tripId": id })
    .select(
      "bookingId trip commuter createdAt updatedAt seatNumber price ticketStatus bookingStatus -_id"
    )
    .populate({
      path: "commuter",
      select: "commuterId name nic contact -_id",
    });
  return foundBookings;
};

export const getBookingByEticket = async (eTicket) => {
  const foundBooking = await Booking.findOne({
    eTicket: eTicket,
    bookingStatus: "PAID",
  })
    .select(
      "bookingId trip commuter createdAt updatedAt qrValidationToken eTicket seatNumber price ticketStatus bookingStatus -_id"
    )
    .populate({
      path: "commuter",
      select: "commuterId name nic contact -_id",
    });

  if (!foundBooking) return "NO_BOOKING_FOUND";

  const otpVerification = await OtpVerification.findOne({
    bookingId: foundBooking.bookingId,
    type: "E_TICKET_VERIFICATION_GET",
    status: "VERIFIED",
  });

  if (otpVerification) {
    const emailTicket = getEmailBodyForETicketAndQR(
      foundBooking.commuter.name.firstName,
      foundBooking.bookingId,
      foundBooking.qrValidationToken,
      foundBooking.eTicket
    );
    await sendEmail(
      foundBooking.commuter.contact.email.trim(),
      emailTicket,
      "E-Ticket and QR Code"
    );
    return filterBookingFieldsWithOutVerificationCode(foundBooking);
  } else {
    const otpWaiting = process.env.OTP_WAITING_ETICKET || 4;

    const otp = generateOtp();
    const optVerification = {
      verificationId: generateShortUuid(),
      otp: otp,
      expiryAt: new Date(Date.now() + otpWaiting * 60 * 1000),
      bookingId: foundBooking.bookingId,
      status: "NOT_VERIFIED",
      type: "E_TICKET_VERIFICATION_GET",
    };

    const newOtpVerification = new OtpVerification(optVerification);
    const savedOtpVerification = await newOtpVerification.save();

    const emailBody = getEmailBodyForCommuterVerification(
      otp,
      foundBooking.commuter.name.firstName,
      otpWaiting
    );
    await sendOtpEmail(foundBooking.commuter.contact.email, emailBody);
    return {
      verificationId: savedOtpVerification.verificationId,
    };
  }
};

export const updateBookingStatusById = async (
  data,
  bookingId,
  foundBooking
) => {
  const otpVerification = await OtpVerification.findOne({
    bookingId: foundBooking.bookingId,
    type: "E_TICKET_VERIFICATION_GET",
    status: "VERIFIED",
  });

  if (!otpVerification) {
    return "NO_VERIFICATION";
  } else {
    const newData = {
      ...data,
      cancelledAt: Date.now(),
    };
    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingId: bookingId },
      newData,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedBooking) return null;
    await triggerBookingStatusChangedEvent(
      updatedBooking.trip.tripId,
      updatedBooking.seatNumber
    );

    const emailCancellation = getEmailBodyForBookingCancellation(
      foundBooking.commuter.name.firstName,
      updatedBooking.bookingId,
      updatedBooking.trip.tripId,
      updatedBooking.cancelledAt,
      updatedBooking.trip.cancellationPolicy.description
    );
    await sendEmail(
      foundBooking.commuter.contact.email.trim(),
      emailCancellation,
      "Booking Cancellation Confirmation"
    );
    return filterBookingFieldsWithOutVerificationCode(updatedBooking);
  }
};

export const useTicket = async (data, foundBooking) => {
  const newData = {
    ticketStatus: data.ticketStatus,
  };
  const updatedBooking = await Booking.findOneAndUpdate(
    { bookingId: foundBooking.bookingId },
    newData,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedBooking) return null;

  const emailOnboard = getEmailBodyForSuccessfulOnboarding(
    foundBooking.commuter.name.firstName,
    foundBooking.bookingId,
    foundBooking.trip.tripNumber
  );
  await sendEmail(
    foundBooking.commuter.contact.email.trim(),
    emailOnboard,
    "Successful Commuter Onboard"
  );
  return filterBookingFieldsWithOutVerificationCode(updatedBooking);
};

const triggerBookingStatusChangedEvent = async (tripId, seatNumber) => {
  const eventParams = {
    Entries: [
      {
        Source: "booking-service",
        DetailType: "TRIP_SUPPORT_SERVICE",
        Detail: JSON.stringify({
          internalEventType: "EVN_BOOKING_CANCELLED",
          tripId: tripId,
          seatNumber: seatNumber,
        }),
        EventBusName: "busriya.com_event_bus",
      },
    ],
  };
  await eventBridge.putEvents(eventParams).promise();
};

const filterBookingFieldsWithOutVerificationCode = (booking) => ({
  bookingId: booking.bookingId,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
  expiryAt: booking.expiryAt,
  commuter: booking.commuter,
  trip: booking.trip,
  seatNumber: booking.seatNumber,
  bookingStatus: booking.bookingStatus,
  ticketStatus: booking.ticketStatus,
});

const filterBookingFields = (booking, verificationId) => ({
  bookingId: booking.bookingId,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
  expiryAt: booking.expiryAt,
  commuter: booking.commuter,
  trip: booking.trip,
  seatNumber: booking.seatNumber,
  bookingStatus: booking.bookingStatus,
  verificationId: verificationId,
});

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

const sendOtpEmail = async (toEmail, emailBody) => {
  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "OTP for Commuter Verification",
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

const triggerEventForBookingExpiration = async (
  delay,
  bookingId,
  tripId,
  seatNumber
) => {
  const currentTime = new Date();
  const futureTime = new Date(currentTime.getTime() + delay * 60000);
  const formattedTime = futureTime
    .toISOString()
    .replace(".000", "")
    .slice(0, 19);

  const inputPayload = {
    detail: {
      internalEventType: "EVN_BOOKING_CREATED_FOR_DELAYED_BOOKING_CHECKING",
      bookingId: bookingId,
      tripId: tripId,
      seatNumber: seatNumber,
    },
  };

  const scheduleName = `booking-expiration-${bookingId}`;

  const params = {
    Name: scheduleName,
    ScheduleExpression: `at(${formattedTime})`,
    FlexibleTimeWindow: {
      Mode: "OFF",
    },
    Target: {
      Arn: process.env.BOOKING_SUPPORT_SERVICE_ARN,
      RoleArn: process.env.SCHEDULER_ROLE_ARN,
      Input: JSON.stringify(inputPayload),
    },
    Description: `Trigger for booking expiration - ${bookingId}`,
  };

  const command = new CreateScheduleCommand(params);
  const response = await schedulerClient.send(command);
};

const triggerBookingCreatedEvent = async (booking) => {
  const eventParams = {
    Entries: [
      {
        Source: "booking-service",
        DetailType: "TRIP_SUPPORT_SERVICE",
        Detail: JSON.stringify({
          internalEventType: "EVN_BOOKING_CREATED",
          bookingId: booking.bookingId,
          tripId: booking.trip.tripId,
          seatNumber: booking.seatNumber,
        }),
        EventBusName: "busriya.com_event_bus",
      },
    ],
  };
  await eventBridge.putEvents(eventParams).promise();
};
