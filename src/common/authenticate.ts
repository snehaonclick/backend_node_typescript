const jwt = require("jsonwebtoken");
const Model = require("../models");

module.exports.getToken = (data) =>
  jwt.sign(data, process.env.SECRET_KEY, { expiresIn: "30 days" });

module.exports.verifyToken = (token) =>
  jwt.verify(token, process.env.SECRET_KEY);

module.exports.verify = (...args) => async (req, res, next) => {
  try {
    // console.log(req.headers, req.body, req.files, req.file);

    const roles = [].concat(args).map((role) => role.toLowerCase());
    const token = String(req.headers.authorization || "")
      .replace(/bearer|jwt/i, "")
      .replace(/^\s+|\s+$/g, "");
    let decoded;
    if (token) decoded = this.verifyToken(token);
    console.log(token ,"hgftd")
    // let doc = null;
    // let role = "";    if (roles.includes("user")) {
    //   role = "user";
    //   doc = await Model.User.findOne({
    //     _id: decoded._id,
    //     accessToken: token,
    //     isBlocked: false,
    //     isDeleted: false,
    //   });
    // }
    // if (!doc) throw new Error("INVALID_TOKEN");
    // if (role) req[role] = doc.toJSON();
    // proceed next
    next();
  } catch (error) {
    console.error(error);
    const message =
      String(error.name).toLowerCase() === "error"
        ? error.message
        : "UNAUTHORIZED_ACCESS";
    return res.error(401, message);
  }
};
