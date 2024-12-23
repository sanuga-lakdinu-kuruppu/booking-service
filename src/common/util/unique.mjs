import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

export const generateShortUuid = () => {
  return Math.floor(10000000 + Math.random() * 90000000);
};

export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

export const generateTicket = () => {
  const eTicket = uuidv4();
  return eTicket;
};

export const generateQrString = async (eTicket) => {
  const qrData = JSON.stringify({ eTicket });
  const qrToken = await QRCode.toDataURL(qrData);
  return qrToken;
};
