export const generateShortUuid = () => {
  return Math.floor(10000000 + Math.random() * 90000000);
};

export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};
