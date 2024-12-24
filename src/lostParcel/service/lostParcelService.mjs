import { Booking } from "../../booking/model/bookingModel.mjs";
import { LostParcel } from "../model/lostParcelModel.mjs";
import { v4 as uuidv4 } from "uuid";
import { getEmailBodyForLostParcelRequestSuccess } from "../../common/util/emailTemplate.mjs";
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
