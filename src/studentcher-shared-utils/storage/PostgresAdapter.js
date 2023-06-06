"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.PostgresAdapter = void 0;
var pg_1 = require("pg");
var PostgresAdapter = /** @class */ (function () {
    function PostgresAdapter(_a) {
        var host = _a.host, database = _a.database, user = _a.user, password = _a.password, _b = _a.max, max = _b === void 0 ? 25 : _b, _c = _a.min, min = _c === void 0 ? 4 : _c, _d = _a.connectionTimeoutMillis, connectionTimeoutMillis = _d === void 0 ? 10000 : _d;
        this.pgPool = new pg_1["default"].Pool({ host: host, database: database, user: user, password: password, max: max, min: min, connectionTimeoutMillis: connectionTimeoutMillis });
    }
    PostgresAdapter.prototype.callDbCmd = function (sqlQuery, values) {
        if (values === void 0) { values = []; }
        return __awaiter(this, void 0, void 0, function () {
            var client, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pgPool.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, 5, 7]);
                        return [4 /*yield*/, client.query(sqlQuery, values)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        err_1 = _a.sent();
                        throw err_1;
                    case 5: return [4 /*yield*/, client.release()];
                    case 6:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    PostgresAdapter.prototype.callDbTransaction = function (queriesArr, valuesArr) {
        return __awaiter(this, void 0, void 0, function () {
            var client, response, i, _a, _b, err_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (queriesArr.length !== valuesArr.length)
                            throw new Error("queriesArr.length !== valuesArr.length in callDbTransactionCmd");
                        return [4 /*yield*/, this.pgPool.connect()];
                    case 1:
                        client = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 9, 11, 13]);
                        response = {};
                        return [4 /*yield*/, client.query('BEGIN ')];
                    case 3:
                        _c.sent();
                        i = 0;
                        _c.label = 4;
                    case 4:
                        if (!(i < queriesArr.length)) return [3 /*break*/, 7];
                        _a = response;
                        _b = i;
                        return [4 /*yield*/, client.query(queriesArr[i], valuesArr[i])];
                    case 5:
                        _a[_b] = _c.sent();
                        _c.label = 6;
                    case 6:
                        i++;
                        return [3 /*break*/, 4];
                    case 7: return [4 /*yield*/, client.query('COMMIT ')];
                    case 8:
                        _c.sent();
                        return [2 /*return*/, response];
                    case 9:
                        err_2 = _c.sent();
                        return [4 /*yield*/, client.query('ROLLBACK')];
                    case 10:
                        _c.sent();
                        throw err_2;
                    case 11: return [4 /*yield*/, client.release()];
                    case 12:
                        _c.sent();
                        return [7 /*endfinally*/];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    return PostgresAdapter;
}());
exports.PostgresAdapter = PostgresAdapter;
