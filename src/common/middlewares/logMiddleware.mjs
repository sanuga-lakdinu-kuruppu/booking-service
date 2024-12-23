import { getBaseLog } from "../util/log.mjs";

export const logRequestMiddleware = (request, response, next) => {
  const baseLog = getBaseLog(request);
  request.baseLog = baseLog;
  next();
};
