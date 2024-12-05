import express from "express";
import serverless from "serverless-http";
import createConnection from "./src/common/config/databaseConnection.mjs";
import { swaggerUI, swaggerDocs } from "./swagger/swaggerConfig.mjs";
import routes from "./src/common/route/router.mjs";

const app = express();
createConnection();

const SERVICE_NAME = process.env.SERVICE;

app.use(
  `/${SERVICE_NAME}/api-docs`,
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocs)
);

app.use(express.json());

app.use(routes);

// const PORT = process.env.PORT || 5002;
// app.listen(PORT, () => {
//   console.log(`booking-service is up and running on port ${PORT}`);
// });

export const handler = serverless(app);
