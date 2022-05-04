const Joi = require("joi").defaults((schema) => {
    switch (schema.type) {
        case "string":
            return schema.replace(/\s+/, " ");
        default:
            return schema;
    }
});

Joi.objectId = () => Joi.string().pattern(/^[0-9a-f]{24}$/, "valid ObjectId");

module.exports.identify = Joi.object({
    id: Joi.objectId().required(),
});

module.exports.register = Joi.object({
    email: Joi.string().email().optional(),
    phoneNo: Joi.string()
        .regex(/^[0-9]{5,}$/)
        .optional(),
    dialCode: Joi.string()
        .regex(/^\+?[0-9]{1,}$/)
        .optional(),
    password: Joi.string().required()
})
    .or("phoneNo", "email")
    .with("phoneNo", "dialCode")

module.exports.login = Joi.object({
    email: Joi.string().email().optional(),
    phoneNo: Joi.string()
        .regex(/^[0-9]{5,}$/)
        .optional(),
    dialCode: Joi.string()
        .regex(/^\+?[0-9]{1,}$/)
        .optional(),
    password: Joi.string().required(),
    deviceType: Joi.string().allow("WEB", "IOS", "ANDROID").optional(),
    deviceToken: Joi.string().optional(),
})
    .or("phoneNo", "email")
    .with("phoneNo", "dialCode");

module.exports.updateProfile = Joi.object({
    phoneNo: Joi.string().allow("").optional(),
    dialCode: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().allow("").optional(),
    image: Joi.string().allow("").optional(),
    gender: Joi.string().allow("", "MALE", "FEMALE", "OTHER").optional(),
}).or("phoneNo", "dialCode", "firstName", "lastName", "image", "gender");

module.exports.changePassword = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
});

module.exports.createOrder = Joi.object({
    itemName: Joi.string().allow("").optional(),
    itemQuantity: Joi.string().allow("").optional(),
});

module.exports.editOrder = Joi.object({
    orderId : Joi.string().length(24).required(),
    itemName: Joi.string().allow("").optional(),
    itemQuantity: Joi.string().allow("").optional(),
});




