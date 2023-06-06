"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFinishMiddleware = exports.logReceivingMiddleware = void 0;
function logReceivingMiddleware(req, res, next) {
    console.log(`Rout: ${decodeURI(req.url)}, body: ${req.body}, query params: ${req.query.params}`);
    next();
}
exports.logReceivingMiddleware = logReceivingMiddleware;
;
function logFinishMiddleware(req, res, next) {
    res.on("finish", function () {
        console.log(req.method, decodeURI(req.url), res.statusCode, res.statusMessage);
    });
    next();
}
exports.logFinishMiddleware = logFinishMiddleware;
;
