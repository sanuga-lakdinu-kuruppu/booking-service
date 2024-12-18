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

/**
 * @swagger
 * /booking-service/v1.7/otp-verifications/{verificationId}:
 *   patch:
 *     summary: Verify an OTP
 *     tags:
 *       - OTP Verification
 *     description: Verifies the provided OTP for a specific verification ID and updates the status if valid.
 *     parameters:
 *       - in: path
 *         name: verificationId
 *         required: true
 *         schema:
 *           type: number
 *         description: The unique ID for the OTP verification request.
 *         example: 64789625
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: number
 *                 description: The OTP to be verified.
 *                 example: 6027
 *             required:
 *               - otp
 *     responses:
 *       200:
 *         description: Successfully verified the OTP.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verificationId:
 *                   type: number
 *                   example: 64789625
 *                   description: The unique ID for the OTP verification request.
 *                 status:
 *                   type: string
 *                   example: "VERIFIED"
 *                   description: The updated status of the verification.
 *                 type:
 *                   type: string
 *                   example: "COMMUTER_VERIFICATION"
 *                   description: The type of verification.
 *                 bookingId:
 *                   type: number
 *                   example: 21955265
 *                   description: The booking ID associated with the OTP verification.
 *       400:
 *         description: Bad request. Either the verificationId or OTP is invalid, or the commuter is already verified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "otp is required"
 *       404:
 *         description: Resource not found. Either the OTP is incorrect or the verification ID is invalid/expired.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "internal server error"
 */
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
