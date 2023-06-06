"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.CustomError = void 0;
var ApiResponse_1 = require("./ApiResponse");
var CustomError = /** @class */ (function (_super) {
    __extends(CustomError, _super);
    function CustomError(message, status, code) {
        if (status === void 0) { status = 400; }
        if (code === void 0) { code = "000000"; }
        var _this = _super.call(this) || this;
        _this.name = "CustomError";
        _this.message = message;
        _this.code = code;
        _this.status = status;
        _this.extra = {};
        return _this;
    }
    CustomError.prototype.serialize = function () {
        return new ApiResponse_1.ApiResponse(false, { err: { message: this.message, code: this.code } });
    };
    return CustomError;
}(Error));
exports.CustomError = CustomError;
