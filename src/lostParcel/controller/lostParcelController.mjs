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
import { lostParcelUpdateSchema } from "../schema/lostParcelUpdateSchema.mjs";
import {
  createNewLostParcel,
  getAllLostParcels,
  getParcelById,
  getParcelByReferenceId,
  updateLostParcel,
} from "../service/lostParcelService.mjs";

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

router.get(`${API_PREFIX}/lost-parcels`, async (request, response) => {
  const baseLog = request.baseLog;

  try {
    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const foundParcels = await getAllLostParcels();
    const paginatedParcels = foundParcels.slice(skip, skip + limit);
    const totalParcels = foundParcels.length;
    const totalPages = Math.ceil(totalParcels / limit);

    log(baseLog, "SUCCESS", {});
    return response.send({
      data: paginatedParcels,
      currentPage: page,
      totalPages,
      total: totalParcels,
    });
  } catch (error) {
    log(baseLog, "FAILED", error.message);
    return response.status(500).send({ error: "internal server error" });
  }
});

router.get(
  `${API_PREFIX}/lost-parcels/:parcelId`,
  param("parcelId")
    .isNumeric()
    .withMessage("bad request, parcelId should be a number"),
  async (request, response) => {
    const baseLog = request.baseLog;

    try {
      const result = validationResult(request);
      const {
        params: { parcelId },
      } = request;
      if (!result.isEmpty()) {
        log(baseLog, "FAILED", result.errors[0]);
        return response.status(400).send({ error: result.errors[0].msg });
      }

      const foundParcel = await getParcelById(parcelId);

      if (foundParcel) {
        log(baseLog, "SUCCESS", {});
        return response.send(foundParcel);
      } else {
        log(baseLog, "FAILED", "resource not found");
        return response.status(404).send({ error: "resource not found" });
      }
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.get(
  `${API_PREFIX}/lost-parcels/referenceId/:referenceId`,
  param("referenceId")
    .isString()
    .withMessage("bad request, referenceId should be a string"),
  async (request, response) => {
    const baseLog = request.baseLog;

    try {
      const result = validationResult(request);
      const {
        params: { referenceId },
      } = request;
      if (!result.isEmpty()) {
        log(baseLog, "FAILED", result.errors[0]);
        return response.status(400).send({ error: result.errors[0].msg });
      }

      const foundParcel = await getParcelByReferenceId(referenceId);

      if (foundParcel === "NO_PARCEL_FOUND") {
        log(baseLog, "FAILED", "no parcel found for this reference id");
        return response
          .status(404)
          .send({ error: "no parcel found for this reference id" });
      }

      log(baseLog, "SUCCESS", {});
      return response.send(foundParcel);
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.patch(
  `${API_PREFIX}/lost-parcels/:parcelId`,
  param("parcelId")
    .isNumeric()
    .withMessage("bad request, parcelId should be a number"),
  checkSchema(lostParcelUpdateSchema),
  async (request, response) => {
    const baseLog = request.baseLog;

    try {
      const result = validationResult(request);
      const {
        params: { parcelId },
      } = request;
      const data = matchedData(request);
      if (!result.isEmpty()) {
        log(baseLog, "FAILED", result.errors[0]);
        return response.status(400).send({ error: result.errors[0].msg });
      }

      const updatedParcel = await updateLostParcel(parcelId, data);

      if (!updatedParcel) {
        log(baseLog, "FAILED", "internal server error");
        return response.status(500).send({ error: "internal server error" });
      }
      if (updatedParcel === "NO_PARCEL_FOUND") {
        log(baseLog, "FAILED", "no parcel found for this reference id");
        return response
          .status(404)
          .send({ error: "no parcel found for this reference id" });
      }
      log(baseLog, "SUCCESS", {});
      return response.send(updatedParcel);
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
