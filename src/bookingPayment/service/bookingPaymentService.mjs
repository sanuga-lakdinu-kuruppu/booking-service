import { BookingPayment } from "../model/bookingPaymentModel.mjs";
import { Booking } from "../../booking/model/bookingModel.mjs";
import { v4 as uuidv4 } from "uuid";
import { generateShortUuid } from "../../common/util/unique.mjs";
import { PaymentRequest } from "../../paymentRequest/model/paymentRequestModel.mjs";
import axios from "axios";

export const createNewBookingPayment = async (payment) => {
  try {
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
    console.log(`booking payment saved successfully :)`);

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
    console.log(`booking payment request saved successfully :)`);

    const returnObject = {
      paymentId: savedPayment.paymentId,
      redirectUrl: savedRequest.redirectUrl,
      amount: savedPayment.amount,
      method: savedPayment.method,
      type: savedPayment.type,
      status: savedPayment.status,
    };

    return returnObject;
  } catch (error) {
    console.log(`payment creation error ${error}`);
    return null;
  }
};

export const getAllPayments = async () => {
  try {
    const foundPayments = await BookingPayment.find()
      .select(
        "paymentId amount paymentAt createdAt updatedAt method type status -_id"
      )
      .populate({
        path: "booking",
        select: "bookingId -_id",
      });
    console.log(`payments fetched successfully`);
    return foundPayments;
  } catch (error) {
    console.log(`payments getting error ${error}`);
  }
};

export const getBookingPaymentById = async (id) => {
  try {
    const foundPayment = await BookingPayment.findOne({ paymentId: id })
      .select(
        "paymentId amount paymentAt createdAt updatedAt method type status -_id"
      )
      .populate({
        path: "booking",
        select: "bookingId -_id",
      });
    console.log(`payment fetched successfully`);
    return foundPayment;
  } catch (error) {
    console.log(`payment getting error ${error}`);
  }
};

export const getBookingPaymentsByBookingId = async (id) => {
  try {
    const foundBooking = await Booking.findOne({ bookingId: id });
    const foundPayments = await BookingPayment.find({ booking: foundBooking._id })
      .select(
        "paymentId amount paymentAt createdAt updatedAt method type status -_id"
      )
      .populate({
        path: "booking",
        select: "bookingId -_id",
      });
    console.log(`payment fetched successfully`);
    return foundPayments;
  } catch (error) {
    console.log(`payment getting error ${error}`);
  }
};

const callPaymentGWToInitiatePaymentProcess = async (url, body) => {
  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });
    console.log(`payment gateway call success :)`);
    return response.data;
  } catch (error) {
    console.log(`error while calling payment gateway: ${error.message}`);
    return null;
  }
};
