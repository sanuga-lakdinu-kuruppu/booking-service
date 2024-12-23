import { Router } from "express";
import commuterRouter from "../../commuter/controller/commuterController.mjs";
import bookingRouter from "../../booking/controller/bookingController.mjs";
import otpVerificationRouter from "../../otpVerification/controller/optVerificationController.mjs";
import bookingPaymentRouter from "../../bookingPayment/controller/bookingPaymentController.mjs";
import paymentCallbackRouter from "../../paymentCallback/controller/paymentCallbackController.mjs";
import { logRequestMiddleware } from "../middlewares/logMiddleware.mjs";

const router = Router();

router.use(logRequestMiddleware);

router.use(commuterRouter);
router.use(bookingRouter);
router.use(otpVerificationRouter);
router.use(bookingPaymentRouter);
router.use(paymentCallbackRouter);

export default router;
