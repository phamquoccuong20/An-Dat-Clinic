"use strict";

/* Package System */
process.env.NODE_ENV = process.env.NODE_ENV || "development";
const path = require("path");
require("dotenv").config({
  path: path.join(
    __dirname,
    ".env" + (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging" ? "." + process.env.NODE_ENV : ".development")
  ),
});
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bodyParser = require("body-parser");

/* Package Application */
const app = express();
const { validateContentType } = require("./system/Middleware");
const routeService = require("./src/config/Routes");
// const configViewEngine = require("./viewEngine");

try {
  let server;

  app.disable("x-powered-by");

  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") {
    app.use(helmet());
  }

  app.use(cors()); // fix bug CORS
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use((err, req, res, next) => {
    if (err) {
      res.status(400).json({
        status: "error",
        errors: { msg: "Error parsing data" },
      });
    } else next();
  });
  app.use(validateContentType());
  // configViewEngine(app);
  app.use("/v1", routeService);
  app.use("/public", express.static(path.join(__dirname, "/public")));
  app.get("/", (req, res) => {
    res.send("Hi " + process.env.NODE_ENV + " - version: 1.0.0");
  });

  server = require("http").createServer(app);
  server.listen(process.env.PORT);
  console.log(
    `Api master | ${process.env.NODE_ENV} - ${process.pid} is running on port ${process.env.PORT}`
  );
} catch (e) {
  console.log(e);
}
