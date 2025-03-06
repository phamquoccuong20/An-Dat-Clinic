/* eslint-disable no-underscore-dangle */
/* Package System */
require("module-alias/register");
const { fetchApi, genToken, changeToSlug } = require("@utils/Helper");
const Controller = require("@system/Controller");
const axios = require('axios');
const Model = require('@system/Model');
const _ = require('lodash');
/* Package Application */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const { formatEmail, extractBase64 } = require("@utils/Helper");
const fs = require('fs');
const path = require('path');

module.exports = class extends Controller {
  constructor(tableName) {
      super(tableName);
      this.db = new Model("clinics");
  } 
};