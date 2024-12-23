import { v4 as uuidv4 } from "uuid";

export const getBaseLog = (request) => {
  return {
    timestamp: new Date().toISOString(),
    requestId: uuidv4(),
    clientIp: request.ip,
    userAgent: request.get("User-Agent"),
    endpoint: request.originalUrl,
    action: request.method,
  };
};

export const log = (baseLog, status, error) => {
  baseLog.status = status;
  baseLog.error = error;
  console.log(JSON.stringify(baseLog));
};
