"use strict";

/* Package System */
const fs = require("fs");
const { check } = require("express-validator");

/* Application */
const Controller = require("./Controller");
const Function = new Controller("news");

module.exports = (method) => {
  let _validation = [];

  switch (method) {
    case "create":
      break;
    case "update":
      _validation = [check("id", "Trường Id là bắt buộc").not().isEmpty()];
      break;
    case "delete":
      _validation = [check("id", "Trường Id là bắt buộc").not().isEmpty()];
      break;
    case "deleteAll":
      _validation = [check("ids", "Trường Id là bắt buộc").not().isEmpty()];
      break;
    case "updateStatus":
      _validation = [
        check("id", "Trường Id là bắt buộc").not().isEmpty(),
        check("status", "Trường status là bắt buộc").not().isEmpty(),
      ];
      break;
  }

  return _validation;
};
