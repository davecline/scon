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
exports.Queue = void 0;
var EmptyQueueException = /** @class */ (function (_super) {
    __extends(EmptyQueueException, _super);
    function EmptyQueueException() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return EmptyQueueException;
}(Error));
var Queue = /** @class */ (function () {
    function Queue() {
        this.array = [];
    }
    Queue.prototype.add = function (data) {
        this.array.push(data);
    };
    Queue.prototype.remove = function () {
        if (this.isEmpty())
            throw new EmptyQueueException();
        return this.array.shift();
    };
    Queue.prototype.peek = function () {
        if (this.isEmpty())
            throw new EmptyQueueException();
        return this.array[0];
    };
    Queue.prototype.isEmpty = function () {
        return this.array.length === 0;
    };
    return Queue;
}());
exports.Queue = Queue;
/* const queue = new Queue();

queue.add(1);
queue.add(2);
queue.add(3);

console.log(queue.isEmpty());
console.log(queue.peek());
console.log(queue.remove());
console.log(queue.remove());
console.log(queue.remove());
console.log(queue.isEmpty()); */
