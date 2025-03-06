/* Application */
const axios = require("axios");
const crypto = require("crypto");
const EventEmitter = require("events");
const nodemailer = require("nodemailer");
require("dotenv").config();
const sharp = require("sharp");

const apiUrl = process.env.BASE_API_ADMIN;

class Helper {
  genToken = () => {
    const _time = Date.now();
    return `${_time}_${crypto
      .createHash("sha1")
      .update(`${_time} ${process.env.SECRET_SHA_KEY} spaceone.vn`)
      .digest("hex")}`;
  };

  compareToken = (token) => {
    const _parseToken = token.trim().split("_");
    if (_parseToken.length == 2) {
      const _time = parseInt(_parseToken[0]);
      const _shaToken = _parseToken[1];
      if (_time + 60 * 1000 > Date.now()) {
        const _shaAuth = crypto
          .createHash("sha1")
          .update(`${_time} ${process.env.SECRET_SHA_KEY} spaceone.vn`)
          .digest("hex");
        if (_shaAuth != _shaToken) return false;
      } else {
        console.log("Token Expired", this.genToken());
        return false;
      }
    } else return false;
    return true;
  };

  fetchApi = async (url, token) => {
    let _url;
    const _options = {};
    if (url.indexOf("http") != "-1") _url = url;
    else _url = apiUrl + url;
    if (token != "") _options.headers = { Authorization: `Bearer ${token}` };
    return await axios
      .get(_url, _options)
      .then((resp) => resp.data)
      .catch((e) => e);
  };

  postApi = async (url, params, token = "") => {
    let _url;
    const _options = {};
    if (url.indexOf("http") != "-1") _url = url;
    else _url = apiUrl + url;
    if (token != "") _options.headers = { Authorization: `Bearer ${token}` };
    return await axios
      .post(_url, params, _options)
      .then((resp) => resp.data)
      .catch((e) => e);
  };

  postApiToken = async (url, params, token = "") => {
    let _url;
    const _options = {};
    if (url.indexOf("http") != "-1") _url = url;
    else _url = apiUrl + url;
    if (token != "") _options.headers = { Authorization: `Token ${token}` };
    return await axios
      .post(_url, params, _options)
      .then((resp) => resp.data)
      .catch((e) => e);
  };

  putApi = async (url, params, token = "", _options = {}) => {
    let _url;
    if (url.indexOf("http") != "-1") _url = url;
    else _url = apiUrl + url;
    if (token != "") _options.headers = { Authorization: `Bearer ${token}` };
    return await axios.put(_url, params, _options);
  };

  deleteApi = async (url, token = "", params = "") => {
    let _url;
    const _options = {};
    if (url.indexOf("http") != "-1") _url = url;
    else _url = apiUrl + url;
    if (token != "") _options.headers = { Authorization: `Bearer ${token}` };
    if (params != "") _options.data = { ids: params };
    return await axios.delete(_url, _options);
  };

  parseCookie = (str) =>
    str
      .split(";")
      .map((v) => v.split("="))
      .reduce((cookie, v) => {
        cookie[decodeURIComponent(v[0].trim())] = decodeURIComponent(
          v[1].trim()
        );
        return cookie;
      }, {});

  dateFormat = (str) => {
    const _date = new Date(str);
    return `${_date.getDate()}/${_date.getMonth() + 1}/${_date.getFullYear()}`;
  };

  changeToSlug = (str) => {
    const _str = str.trim().toLowerCase();

    return _str
      .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, "a")
      .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, "e")
      .replace(/i|í|ì|ỉ|ĩ|ị/gi, "i")
      .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, "o")
      .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, "u")
      .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, "y")
      .replace(/đ/gi, "d")
      .replace(/&/g, "-va-")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  capitalize = (str) => {
    if (typeof str !== "string") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  extractBase64 = (str) => {
    const _obj = {};

    if (typeof str !== "undefined" && str != "") {
      const _match = str.match(/^data:(.*?)\/(.*?);base64,(.*?)$/i);

      if (typeof _match[1] !== "undefined") _obj.type = _match[1];
      if (typeof _match[2] !== "undefined") _obj.ext = _match[2];
      if (typeof _match[3] !== "undefined") _obj.data = _match[3];
    }

    return _obj;
  };

  trimSlash = (str) => {
    const _arr = str.split("/");

    if (typeof _arr[1] !== "undefined") return _arr[1];
    return str.replace("/", "");
  };

  generateOTP = (_otpLength = 6) => {
    const _digits = "0123456789";
    let _otp = "";
    for (let _i = 1; _i <= _otpLength; _i++) {
      const _index = Math.floor(Math.random() * _digits.length);
      _otp += _digits[_index];
    }
    return _otp;
  };

  generateGiftCode = (customer_id, _addDigits, _codeLength) => {
    const _digits = "0123456789";
    let _code = "";
    for (let _i = 1; _i <= _addDigits; _i++) {
      const _index = Math.floor(Math.random() * _digits.length);
      _code = _code + _digits[_index];
    }
    let final_code = customer_id + _code;
    final_code = final_code.substring(
      final_code.length - _codeLength,
      final_code.length
    );
    return final_code;
  };

  formatPhone = (str) => {
    let result = String(str)
      .trim()
      .replace(/(?!\+)\D+/g, "")
      .replace(/^0|^\+840/g, "+84");
    return result?.indexOf("+84") > -1 ? result : "+84" + result;
  };

  formatEmail = (str) => String(str).trim().toLowerCase();

  validateEmail = (str) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(str).trim().toLowerCase());
  };

  renderRequestHeaders = (token, options) => {
    const RequestHeaders = options;
    if (token !== "") {
      switch (token) {
        case "Token":
        case "spaceone.vn":
          RequestHeaders.headers = {
            ...RequestHeaders.headers,
            Authorization: `Token ${this.genToken()}`,
          };
          break;
        case "admin":
          RequestHeaders.headers = {
            ...RequestHeaders.headers,
            Authorization: `spaceone.vn ${this.genTokenAdmin()}`,
          };
          break;
        default:
          RequestHeaders.headers = {
            ...RequestHeaders.headers,
            Authorization: `Bearer ${token}`,
          };
          break;
      }
    }
    return RequestHeaders;
  };

  get = async (url, data = {}, token = "", options = {}) =>
    new Promise((resolve, reject) => {
      const params = Object.keys(data)
        .map(
          (key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
        )
        .join("&");
      let urlApi = url;
      if (params.length > 0) urlApi += `?${params}`;
      axios
        .get(urlApi, this.renderRequestHeaders(token, options))
        .then((response) => resolve(response.data))
        .catch((e) => reject(e));
    });

  post = async (url, data, token = "", options = {}) =>
    new Promise((resolve, reject) => {
      axios
        .post(url, data, this.renderRequestHeaders(token, options))
        .then((response) => resolve(response.data))
        .catch((e) => reject(e));
    });

  put = async (url, data, token = "", options = {}) =>
    new Promise((resolve, reject) => {
      axios
        .put(url, data, this.renderRequestHeaders(token, options))
        .then((response) => resolve(response.data))
        .catch((e) => reject(e));
    });

  delete = async (url, data, token = "", options = {}) =>
    new Promise((resolve, reject) => {
      const params = Object.keys(data)
        .map(
          (key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
        )
        .join("&");
      let urlApi = url;
      if (params.length > 0) urlApi += `?${params}`;
      axios
        .delete(urlApi, this.renderRequestHeaders(token, options))
        .then((response) => resolve(response.data))
        .catch((e) => reject(e));
    });

  getTasks = (tasks) => {
    return () => {
      const task = tasks.shift();
      if (!task) return;
      return task;
    };
  };

  runConcurrence = async (numConcurrentTasks, getTask, totalTasks) => {
    numConcurrentTasks = Math.min(numConcurrentTasks, totalTasks);
    const processingEmitter = new EventEmitter();
    processingEmitter.once("allDone", (e) => {
      return true;
    });

    if (numConcurrentTasks < 0) return;

    let numberOfDoneTasks = 0;
    processingEmitter.on("oneTaskDone", () => {
      numberOfDoneTasks++;
      const task = getTask();
      if (!task && numberOfDoneTasks < totalTasks) return;
      if (numberOfDoneTasks === totalTasks)
        return processingEmitter.emit("allDone");
      task().then(() => processingEmitter.emit("oneTaskDone"));
    });

    try {
      const initalTasks = [];
      for (let i = 1; i <= numConcurrentTasks; i++) {
        initalTasks.push(
          getTask()().then(() => processingEmitter.emit("oneTaskDone"))
        );
      }
      await Promise.all(initalTasks);
    } catch (e) {
      console.log(e);
      Promise.reject(e);
    }
  };

  sendEmail = async (message) => {
    return new Promise(async (resolve, reject) => {
      const transporter = await nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        host: process.env.MAIL_HOST,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      transporter.sendMail(message, function (error, info) {
        if (error) {
          console.log("error", error);
          return resolve(false);
        } else {
          console.log(info);
          return resolve(true);
        }
      });
    });
  };

  groupBy = async (array, key, keyItem) => {
    return array.reduce((result, currentValue) => {
      if (
        typeof currentValue[key] != "undefined" &&
        typeof currentValue[keyItem] != "undefined"
      ) {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(
          currentValue[keyItem]
        );
        return result;
      }
    }, {});
  };

  generateInvitation = async (invitation_data, token) => {
    try {
      let composite_data = [];
      const textColor = "#ffffff";

      if (
        invitation_data.avatarImagePath != "" &&
        invitation_data.avatarPosition
      ) {
        try {
          let avatarImage = await axios
            .get(invitation_data.avatarImagePath, {
              responseType: "arraybuffer",
              headers: { Authorization: token },
            })
            .then((response) => {
              const imageBuffer = Buffer.from(response.data, "binary");
              return imageBuffer;
            });
          avatarImage = await sharp(avatarImage)
            .resize(
              invitation_data.avatarSize || null,
              invitation_data.avatarSize || null,
              {
                fit: "cover",
                position: "center",
              }
            )
            .toBuffer();
          composite_data.push({
            input: avatarImage,
            gravity: invitation_data.avatarPosition.gravity,
            top: invitation_data.avatarPosition.top,
            left: invitation_data.avatarPosition.left,
          });
        } catch (e) {}
      }

      const templateImage = await axios
        .get(invitation_data.templateImagePath, { responseType: "arraybuffer" })
        .then((response) => {
          // console.log(response)
          const imageBuffer = Buffer.from(response.data, "binary");
          return imageBuffer;
        });
      composite_data.push({ input: templateImage });
      const { width, height } = await sharp(templateImage).metadata();

      if (invitation_data.qrImagePath != "" && invitation_data.qrPosition) {
        const qrImage = await sharp(invitation_data.qrImagePath)
          .resize(
            invitation_data.qrSize || null,
            invitation_data.qrSize || null
          )
          .toBuffer();
        composite_data.push({
          input: qrImage,
          gravity: invitation_data.qrPosition.gravity,
          top: invitation_data.qrPosition.top,
          left: invitation_data.qrPosition.left,
        });
      }

      if (invitation_data.text != "" && invitation_data.textPosition) {
        composite_data.push({
          input: Buffer.from(`
                    <svg width="${width}" height="${height}">
                        <style>
                        @font-face{
                            font-family: Inter;
                            src: url(./src/utils/fonts/Inter-Bold.ttf);
                        }
                        </style>
                        <text 
                        x="${invitation_data.textPosition.left}" 
                        y="${invitation_data.textPosition.top}" 
                        font-size="${invitation_data.textFontSize}"
                        font-family= "Inter"
                        font-weight= "${invitation_data.textFontWeight}"
                        fill="${textColor}" 
                        text-anchor="middle" 
                        alignment-baseline="middle"
                        >${this.removeSign(invitation_data.text).toUpperCase()}
                        </text>
                    </svg>`), // Text to overlay
        });
      }
      if (invitation_data.position != "" && invitation_data.positionPosition) {
        composite_data.push({
          input: Buffer.from(`
                    <svg width="${width}" height="${height}">
                        <style>
                        @font-face{
                            font-family: Inter;
                            src: url(./src/utils/fonts/Inter-Regular.ttf);
                        }
                        </style>
                        <text 
                        x="${invitation_data.positionPosition.left}" 
                        y="${invitation_data.positionPosition.top}" 
                        font-size="${invitation_data.positionFontSize}"
                        font-family= "Inter"
                        font-weight= "${invitation_data.positionFontWeight}"
                        fill="${textColor}" 
                        text-anchor="middle" 
                        alignment-baseline="middle"
                        >${this.removeSign(
                          invitation_data.position
                        ).toUpperCase()}
                        </text>
                    </svg>`), // Text to overlay
        });
      }

      const compositeImage = await sharp({
        create: {
          width: width,
          height: height,
          channels: 4,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite(composite_data)
        .png()
        .toBuffer();
      const base64Image = `data:image/png;base64,${compositeImage.toString(
        "base64"
      )}`;
      return base64Image;
    } catch (error) {
      console.error("An error occurred:", error);
      return false;
      // throw error;
    }
  };
  inArray(needle, haystack, key) {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
      if (haystack[i][key] == needle) return true;
    }
    return false;
  }

  removeSign = (str) => {
    const _str = str.trim().toLowerCase();

    return _str
      .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, "a")
      .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, "e")
      .replace(/i|í|ì|ỉ|ĩ|ị/gi, "i")
      .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, "o")
      .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, "u")
      .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, "y")
      .replace(/đ/gi, "d");
  };
}

module.exports = new Helper();
