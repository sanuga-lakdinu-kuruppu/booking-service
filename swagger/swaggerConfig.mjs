import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

const SWAGGER_URL_PRODUCTION = process.env.SWAGGER_URL_PRODUCTION;
const SWAGGER_URL_LOCAL = process.env.SWAGGER_URL_LOCAL;

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "BOOKING-SERVICE [BUSRIYA.COM]",
      version: "1.2.2",
      description: "Apis for booking services in the busriya system",
      contact: {
        name: "Sanuga Kuruppu [YR3COBSCCOMP232P002]",
        email: "sanugakuruppu.info@gmail.com",
      },
    },
    servers: [
      {
        url: `${SWAGGER_URL_PRODUCTION}`,
        description: "PRODUCTION Stage",
      },
      {
        url: `${SWAGGER_URL_LOCAL}`,
        description: "LOCAL Stage",
      },
    ],
    tags: [
      {
        name: "Commuter",
        description: "Operations related to Commuters.",
      },
    ],
  },
  apis: ["./src/commuter/controller/commuterController.mjs"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export { swaggerDocs, swaggerUI };
