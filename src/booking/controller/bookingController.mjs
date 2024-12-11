import { response, Router } from "express";
import {
  checkSchema,
  matchedData,
  validationResult,
  param,
} from "express-validator";
import { generateShortUuid } from "../../common/util/unique.mjs";
import { bookingSchema } from "../schema/bookingSchema.mjs";
import { createNewBooking } from "../service/bookingService.mjs";

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
          .send({ error: "seat is not in the valid range" });
      return response.status(201).send(createdBooking);
    } catch (error) {
      console.log(`booking creation error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/bookings*`, (request, response) => {
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
