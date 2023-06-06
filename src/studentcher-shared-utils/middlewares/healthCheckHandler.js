"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckMiddleware = void 0;
function healthCheckMiddleware(req, res, _next) {
    return res.status(200).send("ok");
}
exports.healthCheckMiddleware = healthCheckMiddleware;
