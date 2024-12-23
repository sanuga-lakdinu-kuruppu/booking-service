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
import { log } from "../../common/util/log.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

/**
 * @swagger
 * /booking-service/v1.7/booking-payments:
 *   post:
 *     summary: Create a new booking payment
 *     tags:
 *       - Booking Payment
 *     description: Initiate a payment for a booking with the provided booking ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               booking:
 *                 type: number
 *                 example: 97810412
 *                 description: The unique ID of the booking for which payment is being made.
 *             required:
 *               - booking
 *     responses:
 *       201:
 *         description: Payment initiation success.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: number
 *                   example: 81284267
 *                   description: The unique ID of the payment.
 *                 redirectUrl:
 *                   type: string
 *                   example: "https://theweb.asia/payment-gateway/?transactionId=73b9cd33-803c-484b-91ac-d0a54bbb5ef1"
 *                   description: URL to redirect for completing the payment.
 *                 amount:
 *                   type: number
 *                   example: 7500
 *                   description: The total amount to be paid.
 *                 method:
 *                   type: string
 *                   example: "CARD"
 *                   description: The payment method used.
 *                 type:
 *                   type: string
 *                   example: "BOOKING"
 *                   description: The type of payment.
 *                 status:
 *                   type: string
 *                   example: "PENDING"
 *                   description: The current status of the payment.
 *       400:
 *         description: Bad request. Validation errors in input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "this commuter is not verified"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "internal server error"
 */
router.post(
  `${API_PREFIX}/booking-payments`,
  checkSchema(bookingPaymentSchema),
  async (request, response) => {
    const baseLog = request.baseLog;

    const result = validationResult(request);
    if (!result.isEmpty()) {
      log(baseLog, "FAILED", result.errors[0]);
      return response.status(400).send({ error: result.errors[0].msg });
    }

    const data = matchedData(request);

    try {
      data.paymentId = generateShortUuid();
      const createdPayment = await createNewBookingPayment(data);

      if (!createdPayment) {
        log(baseLog, "FAILED", "internal server error");
        return response.status(500).send({ error: "internal server error" });
      }
      log(baseLog, "SUCCESS", {});
      return response.status(201).send(createdPayment);
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

/**
 * @swagger
 * /booking-service/v1.7/booking-payments:
 *   get:
 *     summary: Retrieve all booking payments
 *     tags:
 *       - Booking Payment
 *     description: Fetch a list of all booking payments along with their details.
 *     responses:
 *       200:
 *         description: Successfully retrieved booking payments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   paymentId:
 *                     type: number
 *                     example: 20931686
 *                     description: The unique ID of the payment.
 *                   paymentAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-18T16:06:29.637Z"
 *                     description: The date and time of the payment.
 *                   amount:
 *                     type: number
 *                     example: 7500
 *                     description: The total amount of the payment.
 *                   method:
 *                     type: string
 *                     example: "CARD"
 *                     description: The payment method used.
 *                   type:
 *                     type: string
 *                     example: "BOOKING"
 *                     description: The type of payment.
 *                   status:
 *                     type: string
 *                     example: "PENDING"
 *                     description: The current status of the payment.
 *                   booking:
 *                     type: object
 *                     properties:
 *                       bookingId:
 *                         type: number
 *                         example: 16702615
 *                         description: The unique ID of the associated booking.
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-18T16:06:29.638Z"
 *                     description: The date and time the payment was created.
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-18T16:06:29.638Z"
 *                     description: The date and time the payment was last updated.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "internal server error"
 */
router.get(`${API_PREFIX}/booking-payments`, async (request, response) => {
  const baseLog = request.baseLog;

  try {
    const foundPayments = await getAllPayments();

    log(baseLog, "SUCCESS", {});
    return response.send(foundPayments);
  } catch (error) {
    log(baseLog, "FAILED", error.message);
    return response.status(500).send({ error: "internal server error" });
  }
});

/**
 * @swagger
 * /booking-service/v1.7/booking-payments/paymentId/{paymentId}:
 *   get:
 *     summary: Retrieve booking payment by ID
 *     tags:
 *       - Booking Payment
 *     description: Fetch the details of a specific booking payment by its unique payment ID.
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: number
 *         description: The unique ID of the payment.
 *         example: 20931686
 *     responses:
 *       200:
 *         description: Successfully retrieved the booking payment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: number
 *                   example: 20931686
 *                   description: The unique ID of the payment.
 *                 paymentAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-18T16:06:29.637Z"
 *                   description: The date and time of the payment.
 *                 amount:
 *                   type: number
 *                   example: 7500
 *                   description: The total amount of the payment.
 *                 method:
 *                   type: string
 *                   example: "CARD"
 *                   description: The payment method used.
 *                 type:
 *                   type: string
 *                   example: "BOOKING"
 *                   description: The type of payment.
 *                 status:
 *                   type: string
 *                   example: "PENDING"
 *                   description: The current status of the payment.
 *                 booking:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: number
 *                       example: 16702615
 *                       description: The unique ID of the associated booking.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-18T16:06:29.638Z"
 *                   description: The date and time the payment was created.
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-18T16:06:29.638Z"
 *                   description: The date and time the payment was last updated.
 *       400:
 *         description: Bad request. Invalid paymentId provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "bad request, paymentId should be a number"
 *       404:
 *         description: Resource not found. The specified payment ID does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "resource not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "internal server error"
 */
router.get(
  `${API_PREFIX}/booking-payments/paymentId/:paymentId`,
  param("paymentId")
    .isNumeric()
    .withMessage("bad request, paymentId should be a number"),
  async (request, response) => {
    const baseLog = request.baseLog;

    try {
      const result = validationResult(request);
      const {
        params: { paymentId },
      } = request;
      if (!result.isEmpty()) {
        log(baseLog, "FAILED", result.errors[0]);
        return response.status(400).send({ error: result.errors[0].msg });
      }

      const foundPayment = await getBookingPaymentById(paymentId);

      if (foundPayment) {
        log(baseLog, "SUCCESS", {});
        return response.send(foundPayment);
      } else {
        log(baseLog, "FAILED", "resouce not found");
        return response.status(404).send({ error: "resource not found" });
      }
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

/**
 * @swagger
 * /booking-service/v1.7/booking-payments/bookingId/{bookingId}:
 *   get:
 *     summary: Retrieve booking payments by Booking ID
 *     tags:
 *       - Booking Payment
 *     description: Fetch a list of booking payments associated with a specific booking ID.
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: number
 *         description: The unique ID of the booking.
 *         example: 16702615
 *     responses:
 *       200:
 *         description: Successfully retrieved booking payments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   paymentId:
 *                     type: number
 *                     example: 20931686
 *                     description: The unique ID of the payment.
 *                   paymentAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-18T16:06:29.637Z"
 *                     description: The date and time of the payment.
 *                   amount:
 *                     type: number
 *                     example: 7500
 *                     description: The total amount of the payment.
 *                   method:
 *                     type: string
 *                     example: "CARD"
 *                     description: The payment method used.
 *                   type:
 *                     type: string
 *                     example: "BOOKING"
 *                     description: The type of payment.
 *                   status:
 *                     type: string
 *                     example: "PENDING"
 *                     description: The current status of the payment.
 *                   booking:
 *                     type: object
 *                     properties:
 *                       bookingId:
 *                         type: number
 *                         example: 16702615
 *                         description: The unique ID of the associated booking.
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-18T16:06:29.638Z"
 *                     description: The date and time the payment was created.
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-18T16:06:29.638Z"
 *                     description: The date and time the payment was last updated.
 *       400:
 *         description: Bad request. Invalid bookingId provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "bad request, bookingId should be a number"
 *       404:
 *         description: Resource not found. The specified booking ID does not have any associated payments.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "resource not found"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "internal server error"
 */
router.get(
  `${API_PREFIX}/booking-payments/bookingId/:bookingId`,
  param("bookingId")
    .isNumeric()
    .withMessage("bad request, bookingId should be a number"),
  async (request, response) => {
    const baseLog = request.baseLog;

    try {
      const result = validationResult(request);
      const {
        params: { bookingId },
      } = request;
      if (!result.isEmpty()) {
        log(baseLog, "FAILED", result.errors[0]);
        return response.status(400).send({ error: result.errors[0].msg });
      }

      const foundPayments = await getBookingPaymentsByBookingId(bookingId);

      if (foundPayments) {
        log(baseLog, "SUCCESS", {});
        return response.send(foundPayments);
      } else {
        log(baseLog, "FAILED", "resouce not found");
        return response.status(404).send({ error: "resource not found" });
      }
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/booking-payments*`, (request, response) => {
  const baseLog = request.baseLog;
  log(baseLog, "FAILED", "method not allowed");
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
