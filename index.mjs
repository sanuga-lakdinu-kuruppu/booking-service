import express from "express";
import serverless from "serverless-http";
import createConnection from "./src/common/config/databaseConnection.mjs";
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
import cors from "cors";
import routes from "./src/common/route/router.mjs";

const app = express();
createConnection();

const SERVICE_NAME = process.env.SERVICE;

app.use(`/${SERVICE_NAME}/api-docs`, swaggerUI.serve, (req, res, next) => {
  const swaggerDocument = YAML.load("./swagger/swagger.yml");
  swaggerUI.setup(swaggerDocument)(req, res, next);
});
app.use(express.json());
app.use(cors());
app.use(routes);

// const PORT = process.env.PORT || 5002;
// app.listen(PORT, () => {
//   console.log(`booking-service is up and running on port ${PORT}`);
// });
export const handler = serverless(app);
