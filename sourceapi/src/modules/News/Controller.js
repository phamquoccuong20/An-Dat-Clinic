"use strict";
require("dotenv").config();
/* Package System */
const Controller = require("@system/Controller");
const Model = require("@system/Model");
const { check } = require("express-validator");
const { extractBase64 } = require("@utils/Helper");
const { nanoid } = require("nanoid");
const path = require("path");
const fs = require("fs");

module.exports = class extends Controller {
  constructor(tableName) {
    super(tableName);
    this.db = new Model("news");
  }

  async getAll(req, res) {
    try {
      if (!req.query?.fqnull) req.query.fqnull = "deleted_at";
      req.query.joinQueries = [
        {
          fieldJoin: "category_id",
          fieldTarget: "id",
          table: "categories",
          mergeField: "categories.name as categories_name",
        },
        {
          fieldJoin: "tag_id",
          fieldTarget: "id",
          table: "tags",
          mergeField: "tags.slug as tag_slug",
        },
      ];
      const _data = await this.db.find(req);
      let _items = _data.data.filter((v) => v.id !== process.env.ADMIN_ID);

      this.response(
        res,
        200,
        _data == null ? [] : { data: _items, total: _data.total }
      );
    } catch (e) {
      this.response(res, 500, e.message);
    }
  }
  async create(req, res) {
    try {
      // Validate
      const _check = await this.validate(req, res);

      if (_check == false) {
        let _data = {};
        _data = req.body;
        _data.created_at = new Date();
        _data.updated_at = new Date();
        if (_data?.image_url) {
          try {
            const _parse = extractBase64(_data.image_url.file); // `image` là key trong form upload

            if (!_parse) {
              return this.response(res, 400, "File ảnh không tồn tại.");
            }

            const _name = `/${nanoid()}.${_parse.ext}`;
            const filePath = path.join("./public/upload/news_image", _name);

            await this.uploadFileLocal(_data.image_url, filePath);
            _data.image_url = filePath;
          } catch (e) {
            console.log(e);
            return this.response(res, 500, "Upload failure, please try again");
          }
        }
        if(_data?.tag_id)  _data.tag_id = JSON.stringify(_data?.tag_id);
        this.db.insert(_data);
        this.response(res, 200);
      }
    } catch (e) {
      this.response(res, 500, e.message);
    }
  }
  async update(req, res) {
    try {
      // Validate
      const _check = await this.validate(req, res);

      if (_check == false) {
        let _data = {};
        _data = req.body;
        _data.created_at = new Date();
        _data.updated_at = new Date();
        if (_data?.image_url) {
          try {
            const _parse = extractBase64(_data.image_url.file); // `image` là key trong form upload

            if (!_parse) {
              return this.response(res, 400, "File ảnh không tồn tại.");
            }

            const _name = `/${nanoid()}.${_parse.ext}`;
            const filePath = path.join("./public/upload/news_image", _name);
            await this.uploadFileLocal(_data.image_url, filePath);
            _data.image_url = filePath;
          } catch (e) {
            console.log(e);
            return this.response(res, 500, "Upload failure, please try again");
          }
        }
        if(_data?.ended_at) _data.ended_at = new Date(_data.ended_at);
        if(_data?.tag_id)  _data.tag_id = JSON.stringify(_data?.tag_id);
      this.db.update({ id: req.params.id }, _data);
      this.response(res, 200);
      }
    } catch (e) {
      this.response(res, 500, e.message);
    }
  }

  async uploadFileLocal(imageData, imagePath) {
    try {
      if (imageData && imagePath) {
        const base64Data = imageData.file.replace(/^data:image\/\w+;base64,/, "");
        // console.log(base64Data);
        const _dir = "D:\\mcv\\sourceapi\\public\\upload\\news_image" || path.resolve(process.env.DIR_UPLOAD, "news_image");

        if (!fs.existsSync(_dir)) fs.mkdirSync(_dir);

        fs.writeFileSync(path.join("D:\\mcv\\sourceapi\\", imagePath), base64Data, 
        "base64", function (err) {
            if (err) console.error(err);
            else console.log("File created successfully.");
          }
        );
        return path.join(_dir, imagePath);
      } else {
        console.error("Image data is missing or invalid");
        return null;
      }
    } catch (e) {
      console.log(e);
      return e.message;
    }
  }

  async get(req, res) {
    try {
      const _conditions = {};
      _conditions.id = req.params.id;
      const _result = await this.db.get(_conditions, true);
      // console.log(_result);
      if(_result?.tag_id) _result.tag_id = JSON.parse(_result?.tag_id);

      this.response(res, 200 , {data: _result});
    } catch (e) {
      this.response(res, 500, e.message);
    }
  }
};
