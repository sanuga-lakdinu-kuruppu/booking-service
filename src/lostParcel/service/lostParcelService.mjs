import { Booking } from "../../booking/model/bookingModel.mjs";
import { LostParcel } from "../model/lostParcelModel.mjs";
import { OtpVerification } from "../../otpVerification/model/otpVerificationModel.mjs";
import { v4 as uuidv4 } from "uuid";
import { generateShortUuid, generateOtp } from "../../common/util/unique.mjs";
import {
  getEmailBodyForLostParcelRequestSuccess,
  getEmailBodyForCommuterVerification,
  getEmailBodyForLostParcelStatusUpdate,
} from "../../common/util/emailTemplate.mjs";
import AWS from "aws-sdk";
const ses = new AWS.SES();

export const createNewLostParcel = async (parcel) => {
  const existingParcel = await LostParcel.findOne({ eTicket: parcel.eTicket });
  if (existingParcel) return "ALREADY_CREATED";

  const foundBooking = await Booking.findOne({
    eTicket: parcel.eTicket,
  }).populate({
    path: "commuter",
    select: "commuterId name nic contact -_id",
  });
  if (!foundBooking) return "NO_BOOKING_FOUND";

  const newParcel = {
    ...parcel,
    bookingId: foundBooking.bookingId,
    referenceId: uuidv4(),
    status: "REQUESTED",
    commuter: foundBooking.commuter,
  };

  const createdParcel = new LostParcel(newParcel);
  const savedParcel = await createdParcel.save();

  const email = getEmailBodyForLostParcelRequestSuccess(
    foundBooking.commuter.name.firstName,
    savedParcel
  );
  await sendEmail(
    foundBooking.commuter.contact.email.trim(),
    email,
    "Lost Parcel Request Submitted"
  );
  return filterLostParcelFieldsWithOutAllDetails(savedParcel);
};

export const getAllLostParcels = async () => {
  const foundParcels = await LostParcel.find().select(
    "parcelId trip eTicket createdAt updatedAt referenceId status type name description commuter takeAwayStation  handedOverAt  handedOverPerson bookingId -_id"
  );
  return foundParcels;
};

export const getParcelById = async (id) => {
  const foundParcel = await LostParcel.findOne({ parcelId: id }).select(
    "parcelId trip eTicket createdAt updatedAt referenceId status type name description commuter takeAwayStation  handedOverAt  handedOverPerson bookingId -_id"
  );
  return foundParcel;
};

export const getParcelByReferenceId = async (id) => {
  const foundParcel = await LostParcel.findOne({ referenceId: id }).select(
    "parcelId trip eTicket createdAt updatedAt referenceId status type name description commuter takeAwayStation  handedOverAt  handedOverPerson bookingId -_id"
  );

  if (!foundParcel) return "NO_PARCEL_FOUND";

  const otpVerification = await OtpVerification.findOne({
    bookingId: foundParcel.bookingId,
    type: "LOST_PARCEL_VERIFICATION_GET",
    status: "VERIFIED",
  });

  if (otpVerification) {
    const emailFound = getEmailBodyForLostParcelStatusUpdate(
      foundParcel.commuter.name.firstName,
      foundParcel
    );
    await sendEmail(
      foundParcel.commuter.contact.email.trim(),
      emailFound,
      "Lost Parcel Status"
    );
    return filterLostParcelFieldsWithOutAllDetails(foundParcel);
  } else {
    const otpWaiting = process.env.OTP_WAITING_ETICKET || 4;

    const otp = generateOtp();
    const optVerification = {
      verificationId: generateShortUuid(),
      otp: otp,
      expiryAt: new Date(Date.now() + otpWaiting * 60 * 1000),
      bookingId: foundParcel.bookingId,
      status: "NOT_VERIFIED",
      type: "LOST_PARCEL_VERIFICATION_GET",
    };

    const newOtpVerification = new OtpVerification(optVerification);
    const savedOtpVerification = await newOtpVerification.save();

    const emailBody = getEmailBodyForCommuterVerification(
      otp,
      foundParcel.commuter.name.firstName,
      otpWaiting
    );
    await sendOtpEmail(foundParcel.commuter.contact.email.trim(), emailBody);
    return {
      verificationId: savedOtpVerification.verificationId,
    };
  }
};

export const updateLostParcel = async (parcelId, parcel) => {
  const foundParcel = await LostParcel.findOne({ parcelId: parcelId }).select(
    "parcelId trip eTicket createdAt updatedAt referenceId status type name description commuter takeAwayStation  handedOverAt  handedOverPerson bookingId -_id"
  );

  if (!foundParcel) return "NO_PARCEL_FOUND";

  const newParcel = {
    ...foundParcel,
    status: parcel.status,
    takeAwayStation: {
      name: parcel.takeAwayStation || foundParcel.takeAwayStation.name,
    },
    handedOverAt: parcel.status === "HANDED_OVER" ? Date.now() : null,
    handedOverPerson: {
      firstName:
        parcel.handedOverPersonFirstName ||
        foundParcel.handedOverPerson?.firstName,
      lastName:
        parcel.handedOverPersonLastName ||
        foundParcel.handedOverPerson?.lastName,
      nic: parcel.handedOverPersonNIC || foundParcel.handedOverPerson?.nic,
    },
  };

  const updatedParcel = await LostParcel.findOneAndUpdate(
    { parcelId: parcelId },
    newParcel,
    {
      new: true,
      runValidators: true,
    }
  );

  const emailFound = getEmailBodyForLostParcelStatusUpdate(
    updatedParcel.commuter.name.firstName,
    updatedParcel
  );
  await sendEmail(
    updatedParcel.commuter.contact.email.trim(),
    emailFound,
    `Lost Parcel Status | ${updatedParcel.status} `
  );
  return filterLostParcelFieldsWithAllDetails(updatedParcel);
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

const filterLostParcelFieldsWithAllDetails = (lostParcel) => ({
  parcelId: lostParcel.parcelId,
  createdAt: lostParcel.createdAt,
  updatedAt: lostParcel.updatedAt,
  eTicket: lostParcel.eTicket,
  referenceId: lostParcel.referenceId,
  type: lostParcel.type,
  status: lostParcel.status,
  name: lostParcel.name,
  description: lostParcel.description,
  commuter: lostParcel.commuter,
  takeAwayStation: lostParcel.takeAwayStation,
  handedOverAt: lostParcel.handedOverAt,
  handedOverPerson: lostParcel.handedOverPerson,
});

const filterLostParcelFieldsWithOutAllDetails = (lostParcel) => ({
  parcelId: lostParcel.parcelId,
  createdAt: lostParcel.createdAt,
  updatedAt: lostParcel.updatedAt,
  eTicket: lostParcel.eTicket,
  referenceId: lostParcel.referenceId,
  type: lostParcel.type,
  status: lostParcel.status,
  name: lostParcel.name,
  description: lostParcel.description,
  commuter: lostParcel.commuter,
});
