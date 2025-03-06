"use strict";

/* Package System */
require("dotenv").config();
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

module.exports = () => {
  const dbName = process.env.DB_NAME;

  const _conn = mysql.createConnection({
    database: dbName,
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    pool: Number(process.env.DB_POOL),
    charset: process.env.DB_CHARSET,
    multipleStatements: true,
  });

  async function migrationDB() {
    fs.readdirSync(path.join(__dirname, "../../../src/migrations")).map(
      (file) => {
        let _cql = fs.readFileSync(
          path.join(__dirname, "../../../src/migrations/" + file),
          "utf8"
        );

        // Tách chuỗi
        _cql = _cql.split(/\;(\r\n|\n)/);

        if (_cql && _cql.length > 0) {
          _cql.map(async (query, index) => {
            let _query = query
              .trim()
              .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "");

            // match => kiểm tra _query có khớp ko.
            if (_query.trim().match(/^(CREATE|INSERT|UPDATE)/i) != null) {
              const _runQuery = _query.trim().replace(/;$/, "") + ";";
              await _conn.promise().query(_runQuery);
            }

            if (_query.trim().match(/^(ALTER)/i) != null) {
              const _runQuery = _query.trim().replace(/;$/, "") + ";";
              await _conn.promise().query(_runQuery).then((resp) => resp).catch((e) => e);
            }
          });
        }
      }
    );
  }

  _conn.connect(async (err) => {
    if (err) {
      console.log(
        `Connecting to DB ${dbName} failed with the error: ${err.message}`
      );

      throw new Error(err.message);
    }

    console.log(`Connection established successfully to DB ${dbName}`);

    // sync indices
    migrationDB().catch((e) => console.log(e));
  });

  return _conn;
};
