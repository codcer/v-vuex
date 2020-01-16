"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function normalizeMap(map) {
    return Array.isArray(map)
        ? map.map(key => ({ key, val: key }))
        : Object.keys(map).map(key => ({ key, val: map[key] }));
}
exports.normalizeMap = normalizeMap;
// 监测是否generator方法
exports.isGenerator = (func) => typeof func.prototype.next === "function";
exports.isArray = (arr) => Array.isArray(arr);
exports.isFunc = (fn) => typeof fn === "function";
//# sourceMappingURL=index.js.map