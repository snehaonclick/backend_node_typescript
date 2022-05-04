const _ = require("lodash");
const { nanoid, customAlphabet } = require("nanoid");

module.exports.generateString = (length) => nanoid(length);
module.exports.generateNumber = (length) => customAlphabet("1234567890", length)();