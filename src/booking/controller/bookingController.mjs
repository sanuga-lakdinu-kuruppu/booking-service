import { response, Router } from "express";
import {
  checkSchema,
  matchedData,
  validationResult,
  param,
} from "express-validator";
import { generateShortUuid } from "../../common/util/unique.mjs";
import { bookingSchema } from "../schema/bookingSchema.mjs";
import {
  createNewBooking,
  getAllBookings,
  getBookingById,
  getBookingByTripId,
  getBookingByEticket,
} from "../service/bookingService.mjs";
import { log } from "../../common/util/log.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

router.post(
  `${API_PREFIX}/bookings`,
  checkSchema(bookingSchema),
  async (request, response) => {
    const baseLog = request.baseLog;

    const result = validationResult(request);
    if (!result.isEmpty()) {
      log(baseLog, "FAILED", result.errors[0]);
      return response.status(400).send({ error: result.errors[0].msg });
    }

    const data = matchedData(request);
    try {
      data.bookingId = generateShortUuid();
      const createdBooking = await createNewBooking(data);

      if (!createdBooking) {
        log(baseLog, "FAILED", "internal server error");
        return response.status(500).send({ error: "internal server error" });
      }
      if (createdBooking === "SEAT_IS_ALREADY_USED") {
        log(baseLog, "FAILED", "seat already used");
        return response.status(400).send({ error: "seat already used" });
      }
      if (createdBooking === "SEAT_NOT_IN_THE_VALID_RANGE") {
        log(baseLog, "FAILED", "seat is outside of the expected capacity");
        return response
          .status(400)
          .send({ error: "seat is outside of the expected capacity" });
      }

      log(baseLog, "SUCCESS", {});
      return response.status(201).send(createdBooking);
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.get(`${API_PREFIX}/bookings`, async (request, response) => {
  const baseLog = request.baseLog;

  try {
    const foundBookings = await getAllBookings();

    log(baseLog, "SUCCESS", {});
    return response.send(foundBookings);
  } catch (error) {
    log(baseLog, "FAILED", error.message);
    return response.status(500).send({ error: "internal server error" });
  }
});

router.get(
  `${API_PREFIX}/bookings/:bookingId`,
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

      const foundBooking = await getBookingById(bookingId);

      if (foundBooking) {
        log(baseLog, "SUCCESS", {});
        return response.send(foundBooking);
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
  `${API_PREFIX}/bookings/tripId/:tripId`,
  param("tripId")
    .isNumeric()
    .withMessage("bad request, tripId should be a number"),
  async (request, response) => {
    const baseLog = request.baseLog;

    try {
      const result = validationResult(request);
      const {
        params: { tripId },
      } = request;
      if (!result.isEmpty()) {
        log(baseLog, "FAILED", result.errors[0]);
        return response.status(400).send({ error: result.errors[0].msg });
      }

      const foundBookings = await getBookingByTripId(tripId);

      if (foundBookings) {
        log(baseLog, "SUCCESS", {});
        return response.send(foundBookings);
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
  `${API_PREFIX}/bookings/eTicket/:eTicket`,
  param("eTicket")
    .isString()
    .withMessage("bad request, eTicket should be a String"),
  async (request, response) => {
    const baseLog = request.baseLog;

    try {
      const result = validationResult(request);
      const {
        params: { eTicket },
      } = request;
      if (!result.isEmpty()) {
        log(baseLog, "FAILED", result.errors[0]);
        return response.status(400).send({ error: result.errors[0].msg });
      }

      const foundBooking = await getBookingByEticket(eTicket);

      if (foundBooking === "NO_BOOKING_FOUND") {
        log(baseLog, "FAILED", "no booking found for this ticket");
        return response
          .status(404)
          .send({ error: "no booking found for this ticket" });
      } else {
        log(baseLog, "SUCCESS", {});
        return response.send(foundBooking);
      }
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/bookings*`, (request, response) => {
  const baseLog = request.baseLog;
  log(baseLog, "FAILED", "method not allowed");
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
