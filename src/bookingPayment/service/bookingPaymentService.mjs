import { BookingPayment } from "../model/bookingPaymentModel.mjs";
import { Booking } from "../../booking/model/bookingModel.mjs";
import { v4 as uuidv4 } from "uuid";
import { generateShortUuid } from "../../common/util/unique.mjs";
import { PaymentRequest } from "../../paymentRequest/model/paymentRequestModel.mjs";
import axios from "axios";

export const createNewBookingPayment = async (payment) => {
  const booking = await Booking.findOne({ bookingId: payment.booking });
  if (!booking) return null;

  const systemTransactionId = `${uuidv4()}`;
  const callbackUrl = `https://api.busriya.com/${process.env.SERVICE}/${process.env.VERSION}/payment-callbacks`;

  const body = {
    amount: payment.amount,
    currency: "LKR",
    systemTransactionId: systemTransactionId,
    callbackUrl: callbackUrl,
  };

  const paymentGWUrl = process.env.PAYMENT_GATEWAY_URL;
  const gwResponse = await callPaymentGWToInitiatePaymentProcess(
    paymentGWUrl,
    body
  );
  if (!gwResponse) return null;

  payment = {
    ...payment,
    booking: booking._id,
    paymentAt: new Date(),
    amount: booking.price,
    type: "BOOKING",
    method: "CARD",
    status: "PENDING",
  };

  const newPayment = new BookingPayment(payment);
  const savedPayment = await newPayment.save();

  const paymentRequest = {
    requestId: generateShortUuid(),
    redirectUrl: gwResponse.paymentDetails.redirectUrl,
    callbackUrl: callbackUrl,
    bookingId: booking.bookingId,
    bookingPayment: savedPayment._id,
    systemTransactionId: systemTransactionId,
    gatewayTransactionId: gwResponse.paymentDetails.transactionId,
  };

  const newPaymentRequest = new PaymentRequest(paymentRequest);
  const savedRequest = await newPaymentRequest.save();

  const returnObject = {
    paymentId: savedPayment.paymentId,
    redirectUrl: savedRequest.redirectUrl,
    amount: savedPayment.amount,
    method: savedPayment.method,
    type: savedPayment.type,
    status: savedPayment.status,
  };

  return returnObject;
};

export const getAllPayments = async () => {
  const foundPayments = await BookingPayment.find()
    .select(
      "paymentId amount paymentAt createdAt updatedAt method type status -_id"
    )
    .populate({
      path: "booking",
      select: "bookingId -_id",
    });
  return foundPayments;
};

export const getBookingPaymentById = async (id) => {
  const foundPayment = await BookingPayment.findOne({ paymentId: id })
    .select(
      "paymentId amount paymentAt createdAt updatedAt method type status -_id"
    )
    .populate({
      path: "booking",
      select: "bookingId -_id",
    });
  return foundPayment;
};

export const getBookingPaymentsByBookingId = async (id) => {
  const foundBooking = await Booking.findOne({ bookingId: id });
  const foundPayments = await BookingPayment.find({
    booking: foundBooking._id,
  })
    .select(
      "paymentId amount paymentAt createdAt updatedAt method type status -_id"
    )
    .populate({
      path: "booking",
      select: "bookingId -_id",
    });
  return foundPayments;
};

const callPaymentGWToInitiatePaymentProcess = async (url, body) => {
  const response = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });
  return response.data;
};
