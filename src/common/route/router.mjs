import { Router } from "express";
import commuterRouter from "../../commuter/controller/commuterController.mjs";
import bookingRouter from "../../booking/controller/bookingController.mjs";
import otpVerificationRouter from "../../otpVerification/controller/optVerificationController.mjs";

const router = Router();

router.use(commuterRouter);
router.use(bookingRouter);
router.use(otpVerificationRouter);

export default router;
