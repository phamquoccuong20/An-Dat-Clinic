const express = require("express");
const path = require("path");

const configViewEngine = (app) => {
  app.use("/public", express.static(path.join(__dirname, "/public")));
};

module.exports = configViewEngine;
