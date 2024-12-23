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
} from "../service/bookingService.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

router.post(
  `${API_PREFIX}/bookings`,
  checkSchema(bookingSchema),
  async (request, response) => {
    const result = validationResult(request);
    if (!result.isEmpty())
      return response.status(400).send({ error: result.errors[0].msg });
    const data = matchedData(request);
    try {
      data.bookingId = generateShortUuid();
      const createdBooking = await createNewBooking(data);
      if (!createdBooking)
        return response.status(500).send({ error: "internal server error" });
      if (createdBooking === "SEAT_IS_ALREADY_USED")
        return response.status(400).send({ error: "seat already used" });
      if (createdBooking === "SEAT_NOT_IN_THE_VALID_RANGE")
        return response
          .status(400)
          .send({ error: "seat is outside of the expected capacity" });
      return response.status(201).send(createdBooking);
    } catch (error) {
      console.log(`booking creation error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.get(`${API_PREFIX}/bookings`, async (request, response) => {
  try {
    const foundBookings = await getAllBookings();
    return response.send(foundBookings);
  } catch (error) {
    console.log(`booking getting error ${error}`);
    return response.status(500).send({ error: "internal server error" });
  }
});

router.get(
  `${API_PREFIX}/bookings/:bookingId`,
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
      const foundBooking = await getBookingById(bookingId);
      if (foundBooking) return response.send(foundBooking);
      else return response.status(404).send({ error: "resource not found" });
    } catch (error) {
      console.log(`booking getting error ${error}`);
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
    try {
      const result = validationResult(request);
      const {
        params: { tripId },
      } = request;
      if (!result.isEmpty())
        return response.status(400).send({ error: result.errors[0].msg });
      const foundBookings = await getBookingByTripId(tripId);
      if (foundBookings) return response.send(foundBookings);
      else return response.status(404).send({ error: "resource not found" });
    } catch (error) {
      console.log(`bookings getting error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/bookings*`, (request, response) => {
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
