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
