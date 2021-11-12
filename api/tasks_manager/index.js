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
var path = require("path");
var uuid_1 = require("uuid");
var tasks_js_1 = require("./tasks.js");
var queue_js_1 = require("./lib/queue.js");
var mock_database_filename = "/tmp/tasks.json";
// Standard AWS API Event Handler
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var qs, sm, response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                qs = event.queryStringParameters;
                console.dir("queryStringParamters:" + JSON.stringify(qs));
                sm = new TasksManager(qs);
                return [4 /*yield*/, sm.authorizeAndPerformTask()];
            case 1:
                response = _a.sent();
                //let response = "";
                //console.dir(`response:${response}`);
                return [2 /*return*/, {
                        statusCode: 200,
                        body: "input: " + JSON.stringify(qs) + ", task_state: " + response
                    }];
        }
    });
}); };
exports.handler = handler;
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var TasksManager = /** @class */ (function () {
    function TasksManager(qs) {
        var _this = this;
        //
        // Main entry point for the task processing
        //  Vet the task and if authorized,
        //  allow the task to trigger RStream requests to trigger Worker Lambdas
        //
        this.authorizeAndPerformTask = function () { return __awaiter(_this, void 0, void 0, function () {
            var db, task, priorTask, is_continue, error_1;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 11, , 15]);
                        db = new TasksDatabase();
                        return [4 /*yield*/, db.load()];
                    case 1:
                        _f.sent();
                        console.dir("authorizeAndPerformTask.A:" + JSON.stringify(""));
                        if (!this.qs.task_id) return [3 /*break*/, 9];
                        return [4 /*yield*/, db.get(this.qs.task_id)];
                    case 2:
                        task = _f.sent();
                        if (!task) return [3 /*break*/, 9];
                        return [4 /*yield*/, db.findPriorPriorTask(task.sequence)];
                    case 3:
                        priorTask = _f.sent();
                        if (priorTask && priorTask.status != TaskStatus.passed) {
                            return [2 /*return*/, new TaskResponse(false, "Not authorized. Prior task NOT PASSED. Prior task:", priorTask)];
                        }
                        // Vet the task for authorization and sequence
                        console.dir("authorizeAndPerformTask.B.1:" + JSON.stringify(task));
                        return [4 /*yield*/, this.authorizeTask(task, db)];
                    case 4:
                        is_continue = _f.sent();
                        return [4 /*yield*/, db.get(task.task_id)];
                    case 5:
                        // We altered the task during the authorize -- refetch it...
                        task = _f.sent();
                        console.dir("authorizeAndPerformTask.B.2:" + JSON.stringify(task));
                        if (!(task.status === TaskStatus.passed)) return [3 /*break*/, 6];
                        console.dir("authorizeAndPerformTask.C:" + JSON.stringify(""));
                        return [2 /*return*/, new TaskResponse(true, "Task PASSED. Move to next task.", task)];
                    case 6:
                        if (!is_continue) return [3 /*break*/, 8];
                        console.dir("authorizeAndPerformTask.D:" + JSON.stringify(""));
                        return [4 /*yield*/, this.performTaskWork(task, db)];
                    case 7: return [2 /*return*/, _f.sent()];
                    case 8:
                        console.dir("authorizeAndPerformTask.E:" + JSON.stringify(""));
                        return [2 /*return*/, new TaskResponse(false, "Task failed or is not authorized to continue. Try again.", task)];
                    case 9:
                        console.dir("authorizeAndPerformTask.W:" + JSON.stringify(""));
                        // Reset the mock data file
                        if ((_a = this.qs) === null || _a === void 0 ? void 0 : _a.reset) {
                            writeData(true, tasks_js_1.tasks);
                            return [2 /*return*/, JSON.stringify({ "reset": "database was reset" })];
                        }
                        console.dir("authorizeAndPerformTask.X:" + JSON.stringify(""));
                        // Wipe the data clean -- NO TASKS
                        if ((_b = this.qs) === null || _b === void 0 ? void 0 : _b.wipe) {
                            writeData(true, null);
                            return [2 /*return*/, JSON.stringify({ "wipe": "database was wiped" })];
                        }
                        console.dir("authorizeAndPerformTask.Y:" + JSON.stringify(""));
                        // If nothing is available return warning
                        if ((_c = this.qs) === null || _c === void 0 ? void 0 : _c.retailer_id) {
                            return [2 /*return*/, JSON.stringify({ "warning": "No tasks found to process for retailer_id:" + ((_d = this.qs) === null || _d === void 0 ? void 0 : _d.retailer_id) })];
                        }
                        console.dir("authorizeAndPerformTask.Z:" + JSON.stringify(""));
                        return [4 /*yield*/, getData()];
                    case 10: 
                    // No Querystring -- return all data
                    return [2 /*return*/, _f.sent()];
                    case 11:
                        error_1 = _f.sent();
                        if (!((_e = this.qs) === null || _e === void 0 ? void 0 : _e.start)) return [3 /*break*/, 12];
                        writeData(true, tasks_js_1.tasks);
                        return [2 /*return*/, JSON.stringify({ "start": "Rules have been built" })];
                    case 12: return [4 /*yield*/, getData()];
                    case 13: 
                    // Default if all goes wrong -- return the data
                    return [2 /*return*/, _f.sent()];
                    case 14: return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        }); };
        //
        // Should the Supplier be allowed to process this task?
        // Has the previous task been Passed or Skipped?
        //
        this.authorizeTask = function (task, db) { return __awaiter(_this, void 0, void 0, function () {
            var is_true;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        is_true = (Math.floor(Math.random() * 2) + 1) === 1 ? true : false;
                        console.dir("authorizeTask.A:" + JSON.stringify(is_true));
                        switch (task.status) {
                            case TaskStatus["new"]:
                                is_true = true;
                                task.status = TaskStatus.in_progress;
                                console.dir("authorizeTask.B:" + JSON.stringify(task.status));
                                break;
                            case TaskStatus.in_progress:
                            case TaskStatus.internal_in_progress:
                                task.status = is_true ? TaskStatus.passed : TaskStatus.failed;
                                console.dir("authorizeTask.C:" + JSON.stringify(task.status));
                                break;
                            case TaskStatus.passed:
                                is_true = true;
                                console.dir("authorizeTask.D:" + JSON.stringify(task.status));
                                break;
                            case TaskStatus.failed:
                                is_true = false;
                                task.status = TaskStatus["new"];
                                console.dir("authorizeTask.E:" + JSON.stringify(task.status));
                                break;
                            default:
                                is_true = true;
                                console.dir("authorizeTask.F:" + JSON.stringify(task.status));
                                break;
                        }
                        console.dir("authorizeTask.Z:" + JSON.stringify(task.status));
                        return [4 /*yield*/, db.upsert(task)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, db.persist()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, is_true];
                }
            });
        }); };
        //
        // If the task entails async work -- pass it off to the Worker Lambdas
        //
        this.performTaskWork = function (task, db) { return __awaiter(_this, void 0, void 0, function () {
            var response, _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Set the task to in_progress
                        // This would be done by the Worker Lambda
                        task.status = TaskStatus.in_progress;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 18, , 19]);
                        _a = task.task_type;
                        switch (_a) {
                            case TaskType.a_started: return [3 /*break*/, 2];
                            case TaskType.b_read_onboarding_guide: return [3 /*break*/, 3];
                            case TaskType.c_configured_initial_settings: return [3 /*break*/, 4];
                            case TaskType.d_inventory_loaded: return [3 /*break*/, 5];
                            case TaskType.e_inventory_updated: return [3 /*break*/, 7];
                            case TaskType.f_test_orders_created: return [3 /*break*/, 8];
                            case TaskType.g_acknowledge_orders: return [3 /*break*/, 9];
                            case TaskType.h_single_shipment_all_skus: return [3 /*break*/, 10];
                            case TaskType.i_order_cancelled: return [3 /*break*/, 11];
                            case TaskType.j_ship_sku_cancel_sku: return [3 /*break*/, 12];
                            case TaskType.k_invoice_created: return [3 /*break*/, 13];
                            case TaskType.l_return_shipment: return [3 /*break*/, 14];
                            case TaskType.m_finished: return [3 /*break*/, 15];
                        }
                        return [3 /*break*/, 16];
                    case 2:
                        // Kick off the task-builder lambda rStreams request...
                        response = new TaskResponse(true, "Tasks are now set.", task);
                        return [3 /*break*/, 17];
                    case 3:
                        task.status = TaskStatus.passed;
                        response = new TaskResponse(true, "Onboarding guide has been read.", task);
                        return [3 /*break*/, 17];
                    case 4:
                        task.status = TaskStatus.passed;
                        response = new TaskResponse(true, "Configuration configured.", task);
                        return [3 /*break*/, 17];
                    case 5: return [4 /*yield*/, task_ValidationInventory()];
                    case 6:
                        _b.sent();
                        task.status = TaskStatus.internal_in_progress;
                        response = new TaskResponse(true, "Inventory upload is being processed.", task);
                        return [3 /*break*/, 17];
                    case 7:
                        response = new TaskResponse(true, "Inventory update is being processed", task);
                        return [3 /*break*/, 17];
                    case 8:
                        response = new TaskResponse(true, "Test orders have been created.", task);
                        return [3 /*break*/, 17];
                    case 9:
                        response = new TaskResponse(true, "Acknowledge order is in progress.", task);
                        return [3 /*break*/, 17];
                    case 10:
                        response = new TaskResponse(true, "Order shipment is being vetted.", task);
                        return [3 /*break*/, 17];
                    case 11:
                        response = new TaskResponse(true, "Order cancel is being vetted.", task);
                        return [3 /*break*/, 17];
                    case 12:
                        response = new TaskResponse(true, "Order ship and cancel is being vetted.", task);
                        return [3 /*break*/, 17];
                    case 13:
                        response = new TaskResponse(true, "Invoice test is being processed.", task);
                        return [3 /*break*/, 17];
                    case 14:
                        response = new TaskResponse(true, "Return test is being processed.", task);
                        return [3 /*break*/, 17];
                    case 15:
                        task.status = TaskStatus.passed;
                        response = new TaskResponse(true, "Your are FINISHED!", task);
                        return [3 /*break*/, 17];
                    case 16:
                        response = new TaskResponse(false, "Task_type not found", task);
                        return [3 /*break*/, 17];
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        error_2 = _b.sent();
                        response = new TaskResponse(false, "ERROR performing task work:" + error_2, task);
                        return [3 /*break*/, 19];
                    case 19: 
                    // Save the task to the database
                    // This would normally be done by the Worker Lambda
                    return [4 /*yield*/, db.upsert(task)];
                    case 20:
                        // Save the task to the database
                        // This would normally be done by the Worker Lambda
                        _b.sent();
                        return [4 /*yield*/, db.persist()];
                    case 21:
                        _b.sent();
                        return [2 /*return*/, response];
                }
            });
        }); };
        this.qs = qs;
    }
    return TasksManager;
}());
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["new"] = "new";
    TaskStatus["failed"] = "failed";
    TaskStatus["passed"] = "passed";
    TaskStatus["in_progress"] = "in_progress";
    TaskStatus["skipped"] = "skipped";
    TaskStatus["internal_in_progress"] = "internal_in_progress";
    TaskStatus["internal_error"] = "internal_error";
})(TaskStatus || (TaskStatus = {}));
var TaskType;
(function (TaskType) {
    TaskType["a_started"] = "started";
    TaskType["b_read_onboarding_guide"] = "read_onboarding_guide";
    TaskType["c_configured_initial_settings"] = "configured_initial_settings";
    TaskType["d_inventory_loaded"] = "inventory_loaded";
    TaskType["e_inventory_updated"] = "inventory_updated";
    TaskType["f_test_orders_created"] = "test_orders_created";
    TaskType["g_acknowledge_orders"] = "acknowledge_orders";
    TaskType["h_single_shipment_all_skus"] = "single_shipment_all_skus";
    TaskType["i_order_cancelled"] = "order_cancelled";
    TaskType["j_ship_sku_cancel_sku"] = "ship_sku_cancel_sku";
    TaskType["k_invoice_created"] = "invoice_created";
    TaskType["l_return_shipment"] = "return_shipment";
    TaskType["m_finished"] = "finished";
})(TaskType || (TaskType = {}));
var TaskState = /** @class */ (function () {
    function TaskState(task_type, sequence) {
        var _this = this;
        this.toString = function () {
            return JSON.stringify(_this);
        };
        this.task_id = uuid_1.v4();
        this.task_type = task_type;
        this.status = TaskStatus["new"];
        this.sequence = sequence;
    }
    return TaskState;
}());
var TaskResponse = /** @class */ (function () {
    function TaskResponse(success, message, task) {
        var _this = this;
        this.toString = function () {
            return JSON.stringify(_this);
        };
        this.success = success;
        this.message = message;
        this.task = task;
    }
    return TaskResponse;
}());
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Components to mock:
// - Hash table to hold the mock-database of tasks
// - Queue pop method to server as the SQS consumer lambda
// - Async method to serve as a mock Inventory task validator
// - Async/Sync method to serve as a mock Generic task 
// Hash table to hold the mock-database of tasks
var TasksDatabase = /** @class */ (function () {
    function TasksDatabase() {
        var _this = this;
        this._db = new Map();
        this.load = function () { return __awaiter(_this, void 0, void 0, function () {
            var fsPromises, data;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fsPromises = require('fs').promises;
                        return [4 /*yield*/, fsPromises.readFile(mock_database_filename)["catch"](function (err) { return console.error('Failed to read file', err); })];
                    case 1:
                        data = _a.sent();
                        // We must parse the raw data from the file into JSON
                        data = JSON.parse(data);
                        // Now load the db (Map) with the tasks from the file
                        data.map(function (task) {
                            _this._db.set(task.task_id, task);
                        });
                        return [2 /*return*/];
                }
            });
        }); };
        this.persist = function () { return __awaiter(_this, void 0, void 0, function () {
            var data, _i, _a, val;
            return __generator(this, function (_b) {
                data = [];
                for (_i = 0, _a = Array.from(this._db.values()); _i < _a.length; _i++) {
                    val = _a[_i];
                    data.push(val);
                }
                writeData(true, data);
                return [2 /*return*/];
            });
        }); };
        this.findForTaskType = function (task_type) { return __awaiter(_this, void 0, void 0, function () {
            var _i, _a, val;
            return __generator(this, function (_b) {
                for (_i = 0, _a = Array.from(this._db.values()); _i < _a.length; _i++) {
                    val = _a[_i];
                    if (val.task_type == task_type) {
                        return [2 /*return*/, val];
                    }
                }
                return [2 /*return*/, null];
            });
        }); };
        this.findPriorPriorTask = function (sequence) { return __awaiter(_this, void 0, void 0, function () {
            var _i, _a, val;
            return __generator(this, function (_b) {
                for (_i = 0, _a = Array.from(this._db.values()); _i < _a.length; _i++) {
                    val = _a[_i];
                    if (val.sequence === sequence - 1) {
                        return [2 /*return*/, val];
                    }
                }
                return [2 /*return*/, null];
            });
        }); };
        this.upsert = function (task) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._db.set(task.task_id, task);
                return [2 /*return*/, task];
            });
        }); };
        this.get = function (task_id) { return __awaiter(_this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                record = this._db.get(task_id);
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
    return TasksDatabase;
}());
var doTasksDatabaseTest = function () { return __awaiter(void 0, void 0, void 0, function () {
    var db, task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.dir(">>> doTasksDatabaseTest");
                db = new TasksDatabase();
                //let data = await getData();
                //await db.load(JSON.parse(data));
                return [4 /*yield*/, db.load()];
            case 1:
                //let data = await getData();
                //await db.load(JSON.parse(data));
                _a.sent();
                return [4 /*yield*/, db.get("08173c09-c6fe-4a54-972e-01180ed4c9f0")];
            case 2:
                task = _a.sent();
                console.dir("@@@@ 08173c09-c6fe-4a54-972e-01180ed4c9f0:" + JSON.stringify(task));
                return [2 /*return*/];
        }
    });
}); };
// Queue to hold the SQS-like messages
var doQueueTest = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_queueSQS()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Queue pop method to server as the SQS consumer lambda
var test_queueSQS = function () { return __awaiter(void 0, void 0, void 0, function () {
    var queue, taskState;
    return __generator(this, function (_a) {
        console.dir(">>> test_queueSQS");
        queue = new queue_js_1.Queue();
        queue.add(new TaskState(TaskType.d_inventory_loaded, 1));
        taskState = queue.remove();
        console.dir("test_queueSQL:" + taskState);
        return [2 /*return*/];
    });
}); };
// Async method to serve as a mock Inventory task validator
var task_ValidationInventory = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.dir(">>> task_ValidationInventory: delayed...");
                return [4 /*yield*/, delay(2000)];
            case 1:
                _a.sent();
                console.dir("Do the ES lookup of inventory");
                console.dir("Do the Validation-Lambda vetting");
                console.dir("Update state of inventory task");
                console.dir("<<< task_ValidationInventory");
                return [2 /*return*/];
        }
    });
}); };
function delay(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
var doFileTest = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            //console.dir(`process.env.LAMBDA_TASK_ROOT:${process.env.LAMBDA_TASK_ROOT}`);
            //console.dir(`path.revolve:${path.resolve("/tmp/tasks.json")}`);
            //console.dir(`doFileTest:__dirname:${__dirname}`);
            return [4 /*yield*/, writeData(false, tasks_js_1.tasks)];
            case 1:
                //console.dir(`process.env.LAMBDA_TASK_ROOT:${process.env.LAMBDA_TASK_ROOT}`);
                //console.dir(`path.revolve:${path.resolve("/tmp/tasks.json")}`);
                //console.dir(`doFileTest:__dirname:${__dirname}`);
                _a.sent();
                return [4 /*yield*/, getData().then(function (data) {
                        data = JSON.parse(data);
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
                fs.access(mock_database_filename, fs.constants.F_OK, function (err) {
                    err ? resolve(false) : resolve(true);
                });
            })];
    });
}); };
var writeData = function (is_override, data) {
    if (is_override === void 0) { is_override = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, checkData().then(function (file_exists) {
                        if (!file_exists || is_override) {
                            fs.writeFile(mock_database_filename, JSON.stringify(data), function (err) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        if (err) {
                                            return [2 /*return*/, console.error(err)];
                                        }
                                        console.dir("Tasks file saved!");
                                        return [2 /*return*/];
                                    });
                                });
                            });
                        }
                        else {
                            console.dir("Tasks file exists");
                        }
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
var getData = function () { return __awaiter(void 0, void 0, void 0, function () {
    var fsPromises, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fsPromises = require('fs').promises;
                return [4 /*yield*/, fsPromises.readFile(mock_database_filename)["catch"](function (err) { return console.error('Failed to read file', err); })];
            case 1:
                data = _a.sent();
                return [2 /*return*/, data];
        }
    });
}); };
