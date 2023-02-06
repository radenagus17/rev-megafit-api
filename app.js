if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
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

app.listen(portServer, () => {
  // rescheduleCRON();
  console.log(`Server listen on ${portServer}`);
});

module.exports = app;
