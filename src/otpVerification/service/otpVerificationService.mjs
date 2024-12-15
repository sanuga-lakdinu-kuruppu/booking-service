import { OtpVerification } from "../model/otpVerificationModel.mjs";

export const checkOtp = async (foundVerification, otp) => {
  try {
    if (foundVerification.otp !== String(otp))
      return filterOtpVerificationFields(foundVerification);
    const newData = {
      status: "VERIFIED",
    };
    const updatedOtpVerification = await OtpVerification.findOneAndUpdate(
      { verificationId: foundVerification.verificationId },
      newData,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedOtpVerification)
      return filterOtpVerificationFields(foundVerification);
    return filterOtpVerificationFields(updatedOtpVerification);
  } catch (error) {
    console.log(`otp verification error ${error}`);
    return null;
  }
};

const filterOtpVerificationFields = (otpVerification) => ({
  verificationId: otpVerification.verificationId,
  status: otpVerification.status,
  type: otpVerification.type,
  bookingId: otpVerification.bookingId,
});
