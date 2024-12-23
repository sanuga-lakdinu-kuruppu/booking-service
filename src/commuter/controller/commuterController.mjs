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

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

router.post(
  `${API_PREFIX}/commuters`,
  checkSchema(commuterSchema),
  async (request, response) => {
    const result = validationResult(request);
    if (!result.isEmpty())
      return response.status(400).send({ error: result.errors[0].msg });
    const data = matchedData(request);
    try {
      data.commuterId = generateShortUuid();
      const createdCommuter = await createNewCommuter(data);
      return response.status(201).send(createdCommuter);
    } catch (error) {
      console.log(`commuter creation error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.get(`${API_PREFIX}/commuters`, async (request, response) => {
  try {
    const foundCommuters = await getAllCommuters();
    return response.send(foundCommuters);
  } catch (error) {
    console.log(`commuter getting error ${error}`);
    return response.status(500).send({ error: "internal server error" });
  }
});

router.get(
  `${API_PREFIX}/commuters/:commuterId`,
  param("commuterId")
    .isNumeric()
    .withMessage("bad request, commuterId should be a number"),
  async (request, response) => {
    try {
      const result = validationResult(request);
      const {
        params: { commuterId },
      } = request;
      if (!result.isEmpty())
        return response.status(400).send({ error: result.errors[0].msg });
      const foundCommuter = await getCommuterById(commuterId);
      if (foundCommuter) return response.send(foundCommuter);
      else return response.status(404).send({ error: "resource not found" });
    } catch (error) {
      console.log(`commuter getting error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/commuters*`, (request, response) => {
  return response.status(405).send({ error: "method not allowed" });
});

export default router;
