"use strict";
exports.__esModule = true;
exports.ApiResponse = void 0;
var ApiResponse = /** @class */ (function () {
    function ApiResponse(success, data) {
        if (data === void 0) { data = {}; }
        this.success = success;
        this.data = data;
    }
    return ApiResponse;
}());
exports.ApiResponse = ApiResponse;
