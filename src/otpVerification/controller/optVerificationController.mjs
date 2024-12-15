import { response, Router } from "express";
import {
  checkSchema,
  matchedData,
  validationResult,
  param,
} from "express-validator";
import { OtpVerification } from "../model/otpVerificationModel.mjs";
import { otpVerificationSchema } from "../schema/otpVerificationSchema.mjs";
import { checkOtp } from "../service/otpVerificationService.mjs";

const router = Router();

const SERVICE_NAME = process.env.SERVICE;
const VERSION = process.env.VERSION;
const API_PREFIX = `/${SERVICE_NAME}/${VERSION}`;

router.patch(
  `${API_PREFIX}/otp-verifications/:verificationId`,
  param("verificationId")
    .isNumeric()
    .withMessage("bad request, verificationId should be a number"),
  checkSchema(otpVerificationSchema),
  async (request, response) => {
    try {
      const result = validationResult(request);
      const {
        params: { verificationId },
      } = request;
      const data = matchedData(request);
      if (!result.isEmpty())
        return response.status(400).send({ error: result.errors[0].msg });
      const foundVerification = await OtpVerification.findOne({
        verificationId: verificationId,
      });
      if (!foundVerification)
        return response
          .status(400)
          .send({ error: "requested verificationId is incorrect or expired" });
      if (foundVerification.status === "VERIFIED")
        return response.status(400).send({
          error: `this commuter is already verified`,
        });
      const otpVerification = await checkOtp(foundVerification, data.otp);
      if (!otpVerification)
        return response.status(404).send({ error: "resource not found" });
      return response.send(otpVerification);
    } catch (error) {
      console.log(`otp verification error ${error}`);
      return response.status(500).send({ error: "internal server error" });
    }
  }
);

router.all(`${API_PREFIX}/otp-verifications*`, (request, response) => {
  return response.status(405).send({ error: "method not allowed" });
});

export default router;