import { Router } from "express";
import commuterRouter from "../../commuter/controller/commuterController.mjs";

const router = Router();

router.use(commuterRouter);

export default router;
