import { Router } from "express";
import commuterRouter from "../../commuter/controller/commuterController.mjs";
import bookingRouter from "../../booking/controller/bookingController.mjs";

const router = Router();

router.use(commuterRouter);
router.use(bookingRouter);

export default router;
