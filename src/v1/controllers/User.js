const _ = require("lodash");
const Model = require("../../models");
const Validation = require("../validations");
const Auth = require("../../common/authenticate");
const functions = require("../../common/functions");
const constants = require("../../common/constants");
const { model } = require("mongoose");


// ONBOARDING API'S
module.exports.register = async (req, res, next) => {
  try {
    await Validation.User.register.validateAsync(req.body);

    if (req.body.email) {
      const checkEmail = await Model.User.findOne({
        email: req.body.email,
        isDeleted: false,
      }).lean();
      if (checkEmail) throw new Error("EMAIL_ALREADY_EXISTS");
    }

    if (req.body.phoneNo) {
      const checkPhone = await Model.User.findOne({
        phoneNo: req.body.phoneNo,
        dialCode: req.body.dialCode,
        isDeleted: false,
      }).lean();
      if (checkPhone) throw new Error("PHONE_ALREADY_EXISTS");
    }

    const doc = await Model.User.create(req.body);
    doc.accessToken = await Auth.getToken({ _id: doc._id });
    await doc.setPassword(req.body.password);
    await doc.save();
    return res.success("ACCOUNT_CREATED_SUCCESSFULLY", doc);
  } catch (error) {
    next(error);
  }
};
module.exports.socialLogin = async (req, res, next) => {
  try {
    const socials = [];
    req.body.googleId && socials.push({
      googleId: req.body.googleId
    });
    req.body.facebookId && socials.push({
      facebookId: req.body.facebookId
    });
    if (!socials.length) throw new Error("MISSING_SOCIAL_HANDLE");

    let user = await Model.User.findOne({
      $or: socials
    });
    let successMessage = "LOGIN_SUCCESSFULLY";

    if (!user) {
      user = await Model.User(req.body);
      successMessage = "REGISTER_SUCCESSFULLY";
    }

    for (const key in req.body) {
      user[key] = req.body[key];
    }

    user.accessToken = await Auth.getToken({
      _id: user._id
    });

    if (user.email) {
      let checkEmail = await Model.User.findOne({
        email:user.email,
        isDeleted:false,
        isBlocked:false
      })
      if(checkEmail.isEmailVerified == false){
        await Model.User.deleteOne({
          email:user.email,
        isDeleted:false
        })
      }
      user.isEmailVerified = true;
    }
    if (user.phoneNo) {
      let checkPhone = await Model.User.findOne({
        phoneNo:user.phoneNo,
        isDeleted:false,
        isBlocked:false
      })
      if(checkPhone.isPhoneVerified == false){
        await Model.Customers.deleteOne({
          phoneNo:user.phoneNo,
        isDeleted:false
        })
      }
      user.isPhoneVerified = true;
    }
    await user.save();
    return res.success(successMessage, user);
  } catch (error) {
    next(error);
  }
};
module.exports.login = async (req, res, next) => {
  try {
    await Validation.User.login.validateAsync(req.body);
    const criteria = [];
    if (req.body.email) {
      criteria.push({ email: req.body.email })
    } else if (req.body.phoneNo && req.body.dialCode) {
      criteria.push({ phoneNo: req.body.phoneNo, dialCode: req.body.dialCode });
    }
    const doc = await Model.User.findOne({
      $or: criteria,
      isDeleted: false,
    });
    if (!doc) throw new Error("INVALID_CREDENTIALS");

    await doc.authenticate(req.body.password);

    if (req.body.phoneNo && !doc.isPhoneVerified) {
      return res.error(403, "ACCOUNT_NOT_VERIFIED");
    }
    if (doc.isBlocked) {
      return res.error(403, "ACCOUNT_BLOCKED");
    }

    doc.accessToken = await Auth.getToken({ _id: doc._id });
    await doc.save();

    return res.success("ACCOUNT_LOGIN_SUCCESSFULLY", doc);
  } catch (error) {
    next(error);
  }
};
module.exports.logout = async (req, res, next) => {
  try {
    await Model.User.updateOne(
      { _id: req.user._id },
      { accessToken: "" }
    );

    return res.success("ACCOUNT_LOGOUT_SUCCESSFULLY");
  } catch (error) {
    next(error);
  }
};
module.exports.getProfile = async (req, res, next) => {
  try {
    const doc = await Model.User.findOne({ _id: req.user._id });
    return res.success("DATA_FETCHED", doc);
  } catch (error) {
    next(error);
  }
};
module.exports.updateProfile = async (req, res, next) => {
  try {
    await Validation.User.updateProfile.validateAsync(req.body);

    const nin = { $nin: [req.user._id] };

    // check other accounts
    if (req.body.phoneNo) {
      const checkPhone = await Model.User.findOne({
        _id: nin,
        dialCode: req.body.dialCode,
        phoneNo: req.body.phoneNo,
        isDeleted: false,
      });
      if (checkPhone) throw new Error("PHONE_ALREADY_IN_USE");
    }
    const updated = await Model.User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: req.body },
      { new: true }
    );

    return res.success("PROFILE_UPDATED_SUCCESSFULLY", updated);
  } catch (error) {
    next(error);
  }
};
module.exports.changePassword = async (req, res, next) => {
  try {
    await Validation.User.changePassword.validateAsync(req.body);

    if (req.body.oldPassword === req.body.newPassword)
      throw new Error("PASSWORDS_SHOULD_BE_DIFFERENT");

    const doc = await Model.User.findOne({ _id: req.user._id });
    if (!doc) throw new Error("ACCOUNT_NOT_FOUND");

    await doc.authenticate(req.body.oldPassword);
    await doc.setPassword(req.body.newPassword);
    await doc.save();

    return res.success("PASSWORD_CHANGED_SUCCESSFULLY");
  } catch (error) {
    next(error);
  }
};

module.exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) throw new Error("UPLOADING_ERROR");

    const filePath = "/" + req.file.path.replace(/\/?public\/?/g, "");

    return res.success("FILE_UPLOADED", { filePath });
  } catch (error) {
    next(error);
  }
}

//order

module.exports.createOrder = async (req, res, next) => {
  try {
    await Validation.User.createOrder.validateAsync(req.body);
    let userId = req.user._id;
    let itemName = req.body.itemName;
    let itemQuantity = req.body.itemQuantity;
    let dataObject = {
      userId: userId,
      itemName: itemName,
      itemQuantity: itemQuantity
    }
    const doc = await Model.Order(dataObject).save();
    return res.success("CREATE_SUCCESSFULL", doc);
  } catch (error) {
    next(error);
  }
};

module.exports.getOrder = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const user = await Model.Order.find({
      isDeleted: false,
      userId: req.user._id
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await Model.Order.countDocuments({
      isDeleted: false,
      userId: req.user._id
    });

    return res.success("ORDER_UPDATED_SUCCESSFULLY", {
      user,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.editOrder = async (req, res, next) => {
  try {
    await Validation.User.editOrder.validateAsync(req.body);
    const updated = await Model.Order.findByIdAndUpdate(
      { _id: req.user.id },
      { $set: req.body },
      { new: true }
    );
    return res.success("ORDER_UPDATED_SUCCESSFULLY", updated);
  } catch (error) {
    next(error);
  }
};

