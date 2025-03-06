/* Package System */
require("module-alias/register");
const fs = require("fs");
const path = require("path");
const router = require("express").Router();

/* Package Application */
const { trimSlash } = require("@utils/Helper");
const isAccountCMSAuth = require("@middleware/auth");
const limit = require("@middleware/rate-limit");
// Set default API response
router.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "success", msg: "API Admin Service v1 Its Working." });
});

// Setup Controller
let _router = "";
const _Controller = {};
const _Validator = {};
const _Function = {};
const _ignore = [];

fs.readdirSync(path.join(__dirname, "../modules")).map((module) => {
  if (module != ".DS_Store") {
    if (module.slice(-1) == "y") {
      _router = `${module
        .slice(0, module.length - 1)
        .toLowerCase()
        .trim()}ies`;
    } else if (module.slice(-1) == "s") {
      _router = module.toLowerCase().trim();
    } else {
      _router = `${module.toLowerCase().trim()}s`;
    }

    // Check File Validator
    if (fs.existsSync(path.join(__dirname, `../modules/${module}/Validator.js`)))
      _Validator[_router] = require(`@modules/${module}/Validator`);

    _Controller[_router] = require(`@modules/${module}/Controller`);
    _Function[_router] = new _Controller[_router](_router.replaceAll("-", "_"));

    // CRUD
    if (_ignore.includes(_router) == false) {
      router.route(`/${_router}`).get(isAccountCMSAuth, (req, res) => {
          _Function[trimSlash(req.route.path)].getAll(req, res);
        })
        .post(
          isAccountCMSAuth,
          _Validator[_router] && _Validator[_router]("create") ? _Validator[_router]("create") : (req, res, next) => next(),
          (req, res) => {
            _Function[trimSlash(req.route.path)].create(req, res);
          }
        )
        .put(
          isAccountCMSAuth,
          _Validator[_router] && _Validator[_router]("updates") ? _Validator[_router]("updates") : (req, res, next) => next(),
          (req, res) => {
            _Function[trimSlash(req.route.path)].updates(req, res);
          }
        );

      router.route(`/${_router}/:id`).get(isAccountCMSAuth, (req, res) => {
          _Function[trimSlash(req.route.path)].get(req, res);
        })
        .put(
          isAccountCMSAuth,
          _Validator[_router] && _Validator[_router]("update") ? _Validator[_router]("update") : (req, res, next) => next(),
          (req, res) => {
            _Function[trimSlash(req.route.path)].update(req, res);
          }
        )
        .delete(isAccountCMSAuth,_Validator[_router] && _Validator[_router]("delete")? _Validator[_router]("delete") : (req, res, next) => next(),
          (req, res) => {
            _Function[trimSlash(req.route.path)].delete(req, res);
          }
        );
    }
  }
});

//SYSTEM
router.route("/set-log").post((req, res) => {_Function.logs.create(req, res);});

router.route("/news-all").get((req, res) => {_Function.news.getAll(req, res);});
router.route("/doctor-all").get((req, res) => {_Function.doctors.getAll(req, res);});
router.route('/get-category').get((req, res) => { _Function.categories.getAll(req, res); });
router.route('/get-doctor').get((req, res) => { _Function.doctor_infor.getAll(req, res); });
router.route('/get-tags').get((req, res) => { _Function.tags.getAll(req, res); });
router.route("/save-contact").post((req, res) => { _Function.contacts.create(req, res); });

//CMS & CMS
router
  .route("/login")
  .post(_Validator.accounts("login"), (req, res) =>
    _Function.accounts.login(req, res)
  );
router
  .route("/token")
  .post(_Validator.accounts("refresh"), (req, res) =>
    _Function.accounts.refreshToken(req, res)
  );
router
  .route("/me")
  .get(isAccountCMSAuth, (req, res) => _Function.accounts.getProfile(req, res))
  .put(isAccountCMSAuth, (req, res) =>
    _Function.accounts.updateProfile(req, res)
  );

module.exports = router;
