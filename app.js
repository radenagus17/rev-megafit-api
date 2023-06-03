if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const swaggerjsdoc = require("swagger-jsdoc");
const swaggerui = require("swagger-ui-express");
// const { rescheduleCRON } = require("./helpers/schedule");
const app = express();
const portServer = process.env.PORT || 3306;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/qr", express.static("qr"));
app.use("/uploads", express.static("uploads"));
app.use("/asset/img", express.static("assets"));

app.use(morgan("dev"));
app.use("/", routes);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Megafit API with Swagger",
      version: "1.0.0",
      description: "This is simple API for Megafit documentation with Swagger",
      contact: {
        name: process.env.CONTACT_NAME,
        url: process.env.CONTACT_URL,
        email: process.env.CONTACT_EMAIL,
      },
    },
    servers: [
      {
        url: process.env.SERVER_URL,
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const spacs = swaggerjsdoc(options);
app.use("/api-docs", swaggerui.serve, swaggerui.setup(spacs));

app.listen(portServer, () => {
  // rescheduleCRON();
  console.log(`Server listen on ${portServer}`);
});

module.exports = app;
