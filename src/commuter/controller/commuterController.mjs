import { response, Router } from "express";
import {
  checkSchema,
  matchedData,
  validationResult,
  param,
} from "express-validator";
import { generateShortUuid } from "../../common/util/unique.mjs";
import { commuterSchema } from "../schema/commuterSchema.mjs";
import {
  createNewCommuter,
  getAllCommuters,
  getCommuterById,
} from "../service/commuterService.mjs";
import { log } from "../../common/util/log.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

/**
 * @swagger
 * /booking-service/v1.7/commuters:
 *   post:
 *     summary: Create a new commuter
 *     tags:
 *       - Commuter
 *     description: Create a new commuter with the provided data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: "Sanuga"
 *                   lastName:
 *                     type: string
 *                     example: "Kuruppu"
 *               nic:
 *                 type: string
 *                 example: "200127201635"
 *               contact:
 *                 type: object
 *                 properties:
 *                   mobile:
 *                     type: string
 *                     example: "+94778060563"
 *                   email:
 *                     type: string
 *                     example: "sanugakuruppu.info@gmail.com"
 *     responses:
 *       201:
 *         description: Commuter creation success.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commuterId:
 *                   type: number
 *                   example: 30681684
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-05T21:41:35.858Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-05T21:41:35.858Z"
 *                 name:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: "Sanuga"
 *                     lastName:
 *                       type: string
 *                       example: "Kuruppu"
 *                 nic:
 *                   type: string
 *                   example: "200127201635"
 *                 contact:
 *                   type: object
 *                   properties:
 *                     mobile:
 *                       type: string
 *                       example: "+94778060563"
 *                     email:
 *                       type: string
 *                       example: "sanugakuruppu.info@gmail.com"
 *       400:
 *         description: Bad request. Validation errors in input data.
 *       500:
 *         description: Internal server error.
 */
router.post(
  `${API_PREFIX}/commuters`,
  checkSchema(commuterSchema),
  async (request, response) => {
    const baseLog = request.baseLog;

    const result = validationResult(request);
    if (!result.isEmpty()) {
      log(baseLog, "FAILED", result.errors[0]);
      return response.status(400).send({ error: result.errors[0].msg });
    }

    const data = matchedData(request);

    try {
      data.commuterId = generateShortUuid();
      const createdCommuter = await createNewCommuter(data);

      log(baseLog, "SUCCESS", {});
      return response.status(201).send(createdCommuter);
    } catch (error) {
      log(baseLog, "FAILED", error.message);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

/**
 * @swagger
 * /booking-service/v1.7/commuters:
 *   get:
 *     summary: Get all commuters
 *     tags:
 *       - Commuter
 *     description: Retrieve a list of all commuters.
 *     responses:
 *       200:
 *         description: A list of commuters.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   commuterId:
 *                     type: number
 *                     example: 43814728
 *                   name:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                         example: "Sanuga"
 *                       lastName:
 *                         type: string
 *                         example: "Kuruppu"
 *                   nic:
 *                     type: string
 *                     example: "200127201635"
 *                   contact:
 *                     type: object
 *                     properties:
 *                       mobile:
 *                         type: string
 *                         example: "+94778060563"
 *                       email:
 *                         type: string
 *                         example: "sanugakuruppu.info@gmail.com"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-05T21:40:27.379Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-05T21:40:27.379Z"
 *       500:
 *         description: Internal server error.
 */
router.get(`${API_PREFIX}/commuters`, async (request, response) => {
  const baseLog = request.baseLog;

  try {
    const foundCommuters = await getAllCommuters();

    log(baseLog, "SUCCESS", {});
    return response.send(foundCommuters);
  } catch (error) {
    log(baseLog, "FAILED", error.message);
    return response.status(500).send({ error: "internal server error" });
  }
});

/**
 * @swagger
 * /booking-service/v1.7/commuters/{commuterId}:
 *   get:
 *     summary: Get a commuter by ID
 *     tags:
 *       - Commuter
 *     description: Retrieve details of a commuter using their ID.
 *     parameters:
 *       - in: path
 *         name: commuterId
 *         required: true
 *         description: Unique ID of the commuter to retrieve.
 *         schema:
 *           type: number
 *           example: 43814728
 *     responses:
 *       200:
 *         description: Commuter details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commuterId:
 *                   type: number
 *                   example: 43814728
 *                 name:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: "Sanuga"
 *                     lastName:
 *                       type: string
 *                       example: "Kuruppu"
 *                 nic:
 *                   type: string
 *                   example: "200127201635"
 *                 contact:
 *                   type: object
 *                   properties:
 *                     mobile:
 *                       type: string
 *                       example: "+94778060563"
 *                     email:
 *                       type: string
 *                       example: "sanugakuruppu.info@gmail.com"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-05T21:40:27.379Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-05T21:40:27.379Z"
 *       400:
 *         description: Bad request. Validation errors in the input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "bad request, commuterId should be a number"
 *       404:
 *         description: Commuter not found.
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
 */
router.get(
  `${API_PREFIX}/commuters/:commuterId`,
  param("commuterId")
    .isNumeric()
    .withMessage("bad request, commuterId should be a number"),
  async (request, response) => {
    const baseLog = request.baseLog;

    try {
      const result = validationResult(request);
      const {
        params: { commuterId },
      } = request;
      if (!result.isEmpty()) {
        log(baseLog, "FAILED", result.errors[0]);
        return response.status(400).send({ error: result.errors[0].msg });
      }

      const foundCommuter = await getCommuterById(commuterId);

      if (foundCommuter) {
        log(baseLog, "SUCCESS", {});
        return response.send(foundCommuter);
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

router.all(`${API_PREFIX}/commuters*`, (request, response) => {
  const baseLog = request.baseLog;
  log(baseLog, "FAILED", "method not allowed");
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
