import { response, Router } from "express";
import {
  checkSchema,
  matchedData,
  validationResult,
  param,
} from "express-validator";
import { generateShortUuid } from "../../common/util/unique.mjs";
import { paymentCallbackSchema } from "../schema/paymentCallbackSchema.mjs";
import { createNewCallback } from "../service/paymentCallbackService.mjs";
import { log } from "../../common/util/log.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

/**
 * @swagger
 * /booking-service/v1.7//payment-callbacks:
 *   post:
 *     summary: Create a new payment callback
 *     tags:
 *       - Payment Callbacks
 *     description: Handles payment callback requests by validating the input, generating a callback ID, and storing the data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: Unique transaction ID from the payment system.
 *                 example: "trans12345"
 *               systemTransactionId:
 *                 type: string
 *                 description: System-generated transaction ID for the payment.
 *                 example: "sysTrans56789"
 *               status:
 *                 type: string
 *                 description: The status of the payment.
 *                 example: "SUCCESS"
 *               details:
 *                 type: string
 *                 description: Additional details about the payment.
 *                 example: "payment successful"
 *             required:
 *               - transactionId
 *               - systemTransactionId
 *               - status
 *     responses:
 *       201:
 *         description: Callback created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 callbackId:
 *                   type: string
 *                   example: "shortUUID123"
 *                   description: Unique ID generated for the callback.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-19T16:00:00Z"
 *                   description: Timestamp when the callback was created.
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-19T16:00:00Z"
 *                   description: Timestamp when the callback was last updated.
 *                 status:
 *                   type: string
 *                   example: "SUCCESS"
 *                   description: The status of the payment.
 *                 details:
 *                   type: string
 *                   example: "payment successful"
 *                 paymentRequest:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                       example: "trans12345"
 *                       description: The gateway transaction ID related to the payment.
 *       400:
 *         description: Validation error in the request body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "transactionId is required"
 *       500:
 *         description: Internal server error when creating the callback.
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
  `${API_PREFIX}/payment-callbacks`,
  checkSchema(paymentCallbackSchema),
  async (request, response) => {
    const baseLog = request.baseLog;

    const result = validationResult(request);
    if (!result.isEmpty()) {
      log(baseLog, "FAILED", result.errors[0]);
      return response.status(400).send({ error: result.errors[0].msg });
    }

    const data = matchedData(request);
    try {
      data.callbackId = generateShortUuid();
      const createdCallback = await createNewCallback(data);

      if (!createdCallback) {
        log(baseLog, "FAILED", "internal server error");
        return response.status(500).send({ error: "internal server error" });
      }
      log(baseLog, "SUCCESS", {});
      return response.status(201).send(createdCallback);
    } catch (error) {
      console.log(`callback error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/payment-callbacks*`, (request, response) => {
  const baseLog = request.baseLog;
  log(baseLog, "FAILED", "method not allowed");
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
