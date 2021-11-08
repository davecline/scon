"use strict";
/**
 * https://www.npmjs.com/package/serializer.ts
 * https://www.youtube.com/watch?v=AlFkCPHCJEw
 */
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
        while (_) try {
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
exports.handler = void 0;
var fs = require("fs");
//let path = require("path");
var uuid_1 = require("uuid");
var steps_js_1 = require("./steps.js");
var queue_js_1 = require("./lib/queue.js");
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var qs, sm, response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                qs = event.queryStringParameters;
                console.dir("queryStringParamters:" + JSON.stringify(qs));
                sm = new StepsManager(qs);
                response = sm.setStep();
                // Testing Queue
                return [4 /*yield*/, doQueue()];
            case 1:
                // Testing Queue
                _a.sent();
                // Testing file access
                return [4 /*yield*/, doFileTest()];
            case 2:
                // Testing file access
                _a.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        body: "input: " + JSON.stringify(qs) + ", step_state: " + JSON.stringify(response)
                    }];
        }
    });
}); };
exports.handler = handler;
// Queue to hold the SQS-like messages
var doQueue = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_StepsDatabase()];
            case 1:
                _a.sent();
                return [4 /*yield*/, test_queueSQS()];
            case 2:
                _a.sent();
                return [4 /*yield*/, step_ValidationInventory()];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Hash table to hold the mock-database of steps
// Queue pop method to server as the SQS consumer lambda
// Async method to serve as a mock Inventory step validator
// Async/Sync method to serve as a mock Generic step 
//////////////////////////
// Hash table to hold the mock-database of steps
var StepsDatabase = /** @class */ (function () {
    function StepsDatabase() {
        var _this = this;
        this._db = new Map();
        this.upsert = function (step) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._db.set(step.step_id, step);
                return [2 /*return*/, step];
            });
        }); };
        this.get = function (step_id) { return __awaiter(_this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                record = this._db.get(step_id);
                if (record) {
                    return [2 /*return*/, record];
                }
                else {
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
            });
        }); };
    }
    return StepsDatabase;
}());
var test_StepsDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var db, step1, step2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.dir(">>> test_StepsDatabase");
                db = new StepsDatabase();
                return [4 /*yield*/, db.upsert(new StepState(StepType.start, 1))];
            case 1:
                step1 = _a.sent();
                return [4 /*yield*/, db.upsert(new StepState(StepType.generic, 2)).then(function (step) {
                        db.get(step.step_id).then(function (secondStep) {
                            console.dir("test_StepsDatabase:" + secondStep);
                        });
                    })];
            case 2:
                step2 = _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Queue pop method to server as the SQS consumer lambda
var test_queueSQS = function () { return __awaiter(void 0, void 0, void 0, function () {
    var queue, stepState;
    return __generator(this, function (_a) {
        console.dir(">>> test_queueSQS");
        queue = new queue_js_1.Queue();
        queue.add(new StepState(StepType.invoice, 1));
        stepState = queue.remove();
        console.dir("test_queueSQL:" + stepState);
        return [2 /*return*/];
    });
}); };
// Async method to serve as a mock Inventory step validator
var step_ValidationInventory = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.dir(">>> step_ValidationInventory: 5 seconds...");
                return [4 /*yield*/, delay(2000)];
            case 1:
                _a.sent();
                console.dir("<<< step_ValidationInventory");
                return [2 /*return*/];
        }
    });
}); };
function delay(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
// Async/Sync method to serve as a mock Generic step
var StepType;
(function (StepType) {
    StepType["start"] = "start";
    StepType["generic"] = "generic";
    StepType["inventory"] = "inventory";
    StepType["order"] = "order";
    StepType["invoice"] = "invoice";
    StepType["return"] = "return";
    StepType["finish"] = "finish";
})(StepType || (StepType = {}));
var StepState = /** @class */ (function () {
    function StepState(step, sequence) {
        var _this = this;
        this.toString = function () {
            return JSON.stringify(_this);
        };
        this.step_id = (0, uuid_1.v4)();
        this.step = step;
        this.sequence = sequence;
    }
    return StepState;
}());
var StepsManager = /** @class */ (function () {
    function StepsManager(qs) {
        this.qs = qs;
    }
    StepsManager.prototype.setStep = function () {
        try {
            switch (this.qs.step) {
                case StepType.start:
                    return new StepState(StepType.generic, 2);
                case StepType.generic:
                    return new StepState(StepType.inventory, 1);
                case StepType.inventory:
                    return new StepState(StepType.order, 1);
                //
                //
                //
                default:
                    return new StepState(StepType.start, 1);
            }
        }
        catch (error) {
            console.dir("ERROR:" + error);
            return new StepState(StepType.finish, 0);
        }
    };
    return StepsManager;
}());
var doFileTest = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            //console.dir(`process.env.LAMBDA_TASK_ROOT:${process.env.LAMBDA_TASK_ROOT}`);
            //console.dir(`path.revolve:${path.resolve("./steps.json")}`);
            //console.dir(`doFileTest:__dirname:${__dirname}`);
            return [4 /*yield*/, writeData()];
            case 1:
                //console.dir(`process.env.LAMBDA_TASK_ROOT:${process.env.LAMBDA_TASK_ROOT}`);
                //console.dir(`path.revolve:${path.resolve("./steps.json")}`);
                //console.dir(`doFileTest:__dirname:${__dirname}`);
                _a.sent();
                return [4 /*yield*/, getData().then(function (data) {
                        data = JSON.parse(data.toString());
                        console.dir("data:" + JSON.stringify(data));
                    })];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var checkData = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve) {
                fs.access("/tmp/steps.json", fs.constants.F_OK, function (err) {
                    err ? resolve(false) : resolve(true);
                });
            })
            // let file_exists = await fs.exists("/tmp/steps.json", async function(err: boolean) { 
            //   if (err) { 
            //     console.dir("Steps file exists");
            //     return 'true';
            //   } else{
            //     console.dir("Steps file does NOT exist");
            //     return 'false';
            //   }
            // });
            // return file_exists;
        ];
    });
}); };
var writeData = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, checkData().then(function (file_exists) {
                    if (!file_exists) {
                        fs.writeFile("/tmp/steps.json", JSON.stringify(steps_js_1.steps), function (err) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    if (err) {
                                        return [2 /*return*/, console.error(err)];
                                    }
                                    console.dir("Steps file created!");
                                    return [2 /*return*/];
                                });
                            });
                        });
                    }
                    else {
                        console.dir("Steps file exists");
                    }
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var getData = function () { return __awaiter(void 0, void 0, void 0, function () {
    var fsPromises, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fsPromises = require('fs').promises;
                return [4 /*yield*/, fsPromises.readFile("/tmp/steps.json")["catch"](function (err) { return console.error('Failed to read file', err); })];
            case 1:
                data = _a.sent();
                return [2 /*return*/, data];
        }
    });
}); };
