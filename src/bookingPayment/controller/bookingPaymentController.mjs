import { response, Router } from "express";
import {
  checkSchema,
  matchedData,
  validationResult,
  param,
} from "express-validator";
import { generateShortUuid } from "../../common/util/unique.mjs";
import { bookingPaymentSchema } from "../schema/bookingPaymentSchema.mjs";
import {
  createNewBookingPayment,
  getAllPayments,
  getBookingPaymentById,
  getBookingPaymentsByBookingId,
} from "../service/bookingPaymentService.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

router.post(
  `${API_PREFIX}/booking-payments`,
  checkSchema(bookingPaymentSchema),
  async (request, response) => {
    const result = validationResult(request);
    if (!result.isEmpty())
      return response.status(400).send({ error: result.errors[0].msg });
    const data = matchedData(request);
    try {
      data.paymentId = generateShortUuid();
      const createdPayment = await createNewBookingPayment(data);
      if (!createdPayment)
        return response.status(500).send({ error: "internal server error" });
      return response.status(201).send(createdPayment);
    } catch (error) {
      console.log(`booking payment error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.get(`${API_PREFIX}/booking-payments`, async (request, response) => {
  try {
    const foundPayments = await getAllPayments();
    return response.send(foundPayments);
  } catch (error) {
    console.log(`booking payment error ${error}`);
    return response.status(500).send({ error: "internal server error" });
  }
});

router.get(
  `${API_PREFIX}/booking-payments/paymentId/:paymentId`,
  param("paymentId")
    .isNumeric()
    .withMessage("bad request, paymentId should be a number"),
  async (request, response) => {
    try {
      const result = validationResult(request);
      const {
        params: { paymentId },
      } = request;
      if (!result.isEmpty())
        return response.status(400).send({ error: result.errors[0].msg });
      const foundPayment = await getBookingPaymentById(paymentId);
      if (foundPayment) return response.send(foundPayment);
      else return response.status(404).send({ error: "resource not found" });
    } catch (error) {
      console.log(`booking payment error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.get(
  `${API_PREFIX}/booking-payments/bookingId/:bookingId`,
  param("bookingId")
    .isNumeric()
    .withMessage("bad request, bookingId should be a number"),
  async (request, response) => {
    try {
      const result = validationResult(request);
      const {
        params: { bookingId },
      } = request;
      if (!result.isEmpty())
        return response.status(400).send({ error: result.errors[0].msg });
      const foundPayments = await getBookingPaymentsByBookingId(bookingId);
      if (foundPayments) return response.send(foundPayments);
      else return response.status(404).send({ error: "resource not found" });
    } catch (error) {
      console.log(`booking payments error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/booking-payments*`, (request, response) => {
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
