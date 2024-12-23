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
import { log } from "../../common/util/log.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

/**
 * @swagger
 * /booking-service/v1.7/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags:
 *       - Booking
 *     description: Create a new booking for a trip with the specified commuter, trip ID, and seat number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commuter:
 *                 type: number
 *                 example: 52493143
 *                 description: The unique ID of the commuter.
 *               trip:
 *                 type: number
 *                 example: 81957915
 *                 description: The unique ID of the trip.
 *               seatNumber:
 *                 type: number
 *                 example: 46
 *                 description: The seat number for the booking.
 *             required:
 *               - commuter
 *               - trip
 *               - seatNumber
 *     responses:
 *       201:
 *         description: Booking creation success.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookingId:
 *                   type: number
 *                   example: 79318581
 *                 trip:
 *                   type: object
 *                   properties:
 *                     tripId:
 *                       type: number
 *                       example: 81957915
 *                 commuter:
 *                   type: object
 *                   properties:
 *                     commuterId:
 *                       type: number
 *                       example: 52493143
 *                     name:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                           example: "Sanuga"
 *                         lastName:
 *                           type: string
 *                           example: "Kuruppu"
 *                     nic:
 *                       type: string
 *                       example: "200127201635"
 *                     contact:
 *                       type: object
 *                       properties:
 *                         mobile:
 *                           type: string
 *                           example: "+94778060563"
 *                         email:
 *                           type: string
 *                           example: "sanugakuruppu.info@gmail.com"
 *                 seatNumber:
 *                   type: number
 *                   example: 46
 *                 bookingStatus:
 *                   type: string
 *                   example: "CREATING"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-14T15:29:32.018Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-14T15:29:32.018Z"
 *       400:
 *         description: Bad request. Validation errors in input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "seat already used"
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

/**
 * @swagger
 * /booking-service/v1.7/bookings:
 *   get:
 *     summary: Retrieve all bookings
 *     tags:
 *       - Booking
 *     description: Fetch a list of all bookings, including trip, commuter, and booking details.
 *     responses:
 *       200:
 *         description: List of bookings retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   bookingId:
 *                     type: number
 *                     example: 70543086
 *                   trip:
 *                     type: object
 *                     properties:
 *                       tripId:
 *                         type: number
 *                         example: 81957915
 *                       tripNumber:
 *                         type: string
 *                         example: "TRIP-1edfa22f-0f88-4cd0-83ca-5135f2133230"
 *                       tripDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-12-17T00:00:00.000Z"
 *                       startLocation:
 *                         type: object
 *                         properties:
 *                           coordinates:
 *                             type: object
 *                             properties:
 *                               lat:
 *                                 type: number
 *                                 format: double
 *                                 example: 6.933549671456952
 *                               log:
 *                                 type: number
 *                                 format: double
 *                                 example: 79.85550999641683
 *                           stationId:
 *                             type: number
 *                             example: 60287861
 *                           name:
 *                             type: string
 *                             example: "Colombo"
 *                       endLocation:
 *                         type: object
 *                         properties:
 *                           coordinates:
 *                             type: object
 *                             properties:
 *                               lat:
 *                                 type: number
 *                                 format: double
 *                                 example: 6.933549671456952
 *                               log:
 *                                 type: number
 *                                 format: double
 *                                 example: 79.85550999641683
 *                           stationId:
 *                             type: number
 *                             example: 75776150
 *                           name:
 *                             type: string
 *                             example: "Matara"
 *                       schedule:
 *                         type: object
 *                         properties:
 *                           scheduleId:
 *                             type: number
 *                             example: 57500669
 *                           departureTime:
 *                             type: string
 *                             example: "01:30"
 *                           arrivalTime:
 *                             type: string
 *                             example: "10:00"
 *                       vehicle:
 *                         type: object
 *                         properties:
 *                           vehicleId:
 *                             type: number
 *                             example: 82437327
 *                           registrationNumber:
 *                             type: string
 *                             example: "ABC12345"
 *                           model:
 *                             type: string
 *                             example: "Volvo 960"
 *                           capacity:
 *                             type: number
 *                             example: 50
 *                           type:
 *                             type: string
 *                             example: "Luxury"
 *                           airCondition:
 *                             type: boolean
 *                             example: true
 *                           adjustableSeats:
 *                             type: boolean
 *                             example: true
 *                           chargingCapability:
 *                             type: boolean
 *                             example: false
 *                           restStops:
 *                             type: boolean
 *                             example: true
 *                           movie:
 *                             type: boolean
 *                             example: false
 *                           music:
 *                             type: boolean
 *                             example: true
 *                           cupHolder:
 *                             type: boolean
 *                             example: true
 *                           emergencyExit:
 *                             type: boolean
 *                             example: true
 *                       cancellationPolicy:
 *                         type: object
 *                         properties:
 *                           policyId:
 *                             type: number
 *                             example: 67868134
 *                           policyName:
 *                             type: string
 *                             example: "Health Insurance"
 *                           type:
 *                             type: string
 *                             example: "General"
 *                           description:
 *                             type: string
 *                             example: "Comprehensive health coverage for all employees."
 *                   commuter:
 *                     type: object
 *                     properties:
 *                       commuterId:
 *                         type: number
 *                         example: 52493143
 *                       name:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                             example: "Sanuga"
 *                           lastName:
 *                             type: string
 *                             example: "Kuruppu"
 *                       contact:
 *                         type: object
 *                         properties:
 *                           mobile:
 *                             type: string
 *                             example: "+94778060563"
 *                           email:
 *                             type: string
 *                             example: "sanugakuruppu.info@gmail.com"
 *                       nic:
 *                         type: string
 *                         example: "200127201635"
 *                   seatNumber:
 *                     type: number
 *                     example: 41
 *                   bookingStatus:
 *                     type: string
 *                     example: "EXPIRED"
 *                   ticketStatus:
 *                     type: string
 *                     example: "NOT_USED"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-14T11:54:39.801Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-14T11:55:21.193Z"
 *                   price:
 *                     type: number
 *                     example: 7500
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

/**
 * @swagger
 * /booking-service/v1.7/bookings/{bookingId}:
 *   get:
 *     summary: Get a booking by ID
 *     tags:
 *       - Booking
 *     description: Retrieve the details of a specific booking using its ID.
 *     parameters:
 *       - name: bookingId
 *         in: path
 *         required: true
 *         description: The ID of the booking to retrieve.
 *         schema:
 *           type: integer
 *           example: 70543086
 *     responses:
 *       200:
 *         description: Booking found successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trip:
 *                   type: object
 *                   properties:
 *                     startLocation:
 *                       type: object
 *                       properties:
 *                         coordinates:
 *                           type: object
 *                           properties:
 *                             lat:
 *                               type: number
 *                               format: float
 *                               example: 6.933549671456952
 *                             log:
 *                               type: number
 *                               format: float
 *                               example: 79.85550999641683
 *                         stationId:
 *                           type: integer
 *                           example: 60287861
 *                         name:
 *                           type: string
 *                           example: "Colombo"
 *                     endLocation:
 *                       type: object
 *                       properties:
 *                         coordinates:
 *                           type: object
 *                           properties:
 *                             lat:
 *                               type: number
 *                               format: float
 *                               example: 6.933549671456952
 *                             log:
 *                               type: number
 *                               format: float
 *                               example: 79.85550999641683
 *                         stationId:
 *                           type: integer
 *                           example: 75776150
 *                         name:
 *                           type: string
 *                           example: "Matara"
 *                     schedule:
 *                       type: object
 *                       properties:
 *                         scheduleId:
 *                           type: integer
 *                           example: 57500669
 *                         departureTime:
 *                           type: string
 *                           example: "01:30"
 *                         arrivalTime:
 *                           type: string
 *                           example: "10:00"
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         vehicleId:
 *                           type: integer
 *                           example: 82437327
 *                         registrationNumber:
 *                           type: string
 *                           example: "ABC12345"
 *                         model:
 *                           type: string
 *                           example: "Volvo 960"
 *                         capacity:
 *                           type: integer
 *                           example: 50
 *                         type:
 *                           type: string
 *                           example: "Luxury"
 *                         airCondition:
 *                           type: boolean
 *                           example: true
 *                         adjustableSeats:
 *                           type: boolean
 *                           example: true
 *                         chargingCapability:
 *                           type: boolean
 *                           example: false
 *                         restStops:
 *                           type: boolean
 *                           example: true
 *                         movie:
 *                           type: boolean
 *                           example: false
 *                         music:
 *                           type: boolean
 *                           example: true
 *                         cupHolder:
 *                           type: boolean
 *                           example: true
 *                         emergencyExit:
 *                           type: boolean
 *                           example: true
 *                     cancellationPolicy:
 *                       type: object
 *                       properties:
 *                         policyId:
 *                           type: integer
 *                           example: 67868134
 *                         policyName:
 *                           type: string
 *                           example: "Health Insurance"
 *                         type:
 *                           type: string
 *                           example: "General"
 *                         description:
 *                           type: string
 *                           example: "Comprehensive health coverage for all employees."
 *                     tripId:
 *                       type: integer
 *                       example: 81957915
 *                     tripNumber:
 *                       type: string
 *                       example: "TRIP-1edfa22f-0f88-4cd0-83ca-5135f2133230"
 *                     tripDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-12-17T00:00:00.000Z"
 *                 bookingId:
 *                   type: integer
 *                   example: 70543086
 *                 commuter:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                           example: "Sanuga"
 *                         lastName:
 *                           type: string
 *                           example: "Kuruppu"
 *                     contact:
 *                       type: object
 *                       properties:
 *                         mobile:
 *                           type: string
 *                           example: "+94778060563"
 *                         email:
 *                           type: string
 *                           example: "sanugakuruppu.info@gmail.com"
 *                     commuterId:
 *                       type: integer
 *                       example: 52493143
 *                     nic:
 *                       type: string
 *                       example: "200127201635"
 *                 seatNumber:
 *                   type: integer
 *                   example: 41
 *                 bookingStatus:
 *                   type: string
 *                   example: "EXPIRED"
 *                 ticketStatus:
 *                   type: string
 *                   example: "NOT_USED"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-14T11:54:39.801Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-14T11:55:21.193Z"
 *                 price:
 *                   type: number
 *                   example: 7500
 *       400:
 *         description: Bad request. Validation error in input.
 *       404:
 *         description: Booking not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @swagger
 * /booking-service/v1.7/bookings/tripId/{tripId}:
 *   get:
 *     summary: Get bookings by trip ID
 *     tags:
 *       - Booking
 *     description: Retrieve all bookings associated with a specific trip ID.
 *     parameters:
 *       - name: tripId
 *         in: path
 *         required: true
 *         description: The ID of the trip for which bookings are to be retrieved.
 *         schema:
 *           type: integer
 *           example: 81957915
 *     responses:
 *       200:
 *         description: List of bookings found successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   bookingId:
 *                     type: integer
 *                     example: 70543086
 *                   commuter:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                             example: "Sanuga"
 *                           lastName:
 *                             type: string
 *                             example: "Kuruppu"
 *                       contact:
 *                         type: object
 *                         properties:
 *                           mobile:
 *                             type: string
 *                             example: "+94778060563"
 *                           email:
 *                             type: string
 *                             example: "sanugakuruppu.info@gmail.com"
 *                       commuterId:
 *                         type: integer
 *                         example: 52493143
 *                       nic:
 *                         type: string
 *                         example: "200127201635"
 *                   seatNumber:
 *                     type: integer
 *                     example: 41
 *                   bookingStatus:
 *                     type: string
 *                     example: "EXPIRED"
 *                   ticketStatus:
 *                     type: string
 *                     example: "NOT_USED"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-14T11:54:39.801Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-14T11:55:21.193Z"
 *                   price:
 *                     type: number
 *                     example: 7500
 *       400:
 *         description: Bad request. Validation error in input.
 *       404:
 *         description: No bookings found for the given trip ID.
 *       500:
 *         description: Internal server error.
 */
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

router.all(`${API_PREFIX}/bookings*`, (request, response) => {
  const baseLog = request.baseLog;
  log(baseLog, "FAILED", "method not allowed");
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
