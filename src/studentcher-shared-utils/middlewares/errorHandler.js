"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorsHandler = void 0;
const CustomError_1 = require("../models/CustomError");
function errorsHandler(error, req, res, _next) {
    console.log(error.message);
    const err = error.constructor.name === "CustomError" ? error : new CustomError_1.CustomError("Error");
    return res.status(400).json(err.serialize());
}
exports.errorsHandler = errorsHandler;
