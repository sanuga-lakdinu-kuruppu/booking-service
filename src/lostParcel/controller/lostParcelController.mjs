import { response, Router } from "express";
import {
  checkSchema,
  matchedData,
  validationResult,
  param,
} from "express-validator";
import { generateShortUuid } from "../../common/util/unique.mjs";
import { log } from "../../common/util/log.mjs";
import { lostParcelSchema } from "../schema/lostParcelSchema.mjs";
import { createNewLostParcel } from "../service/lostParcelService.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

router.post(
  `${API_PREFIX}/lost-parcels`,
  checkSchema(lostParcelSchema),
  async (request, response) => {
    const baseLog = request.baseLog;

    const result = validationResult(request);
    if (!result.isEmpty()) {
      log(baseLog, "FAILED", result.errors[0]);
      return response.status(400).send({ error: result.errors[0].msg });
    }

    const data = matchedData(request);
    try {
      data.parcelId = generateShortUuid();
      const createdLostParcel = await createNewLostParcel(data);

      if (!createdLostParcel) {
        log(baseLog, "FAILED", "internal server error");
        return response.status(500).send({ error: "internal server error" });
      }
      if (createdLostParcel === "NO_BOOKING_FOUND") {
        log(baseLog, "FAILED", "no relevant booking found for this ticket.");
        return response
          .status(404)
          .send({ error: "no relevant booking found for this ticket." });
      }
      if (createdLostParcel === "ALREADY_CREATED") {
        log(baseLog, "FAILED", "already created a complain for this ticket");
        return response
          .status(400)
          .send({ error: "already created a complain for this ticket" });
      }

      log(baseLog, "SUCCESS", {});
      return response.status(201).send(createdLostParcel);
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/lost-parcels*`, (request, response) => {
  const baseLog = request.baseLog;
  log(baseLog, "FAILED", "method not allowed");
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
