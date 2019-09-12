"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _store;
exports.connect = function (model) {
    if (_store) {
        if (!model.ns || !model.actions) {
            throw new Error("model 不符合规范，至少需要包含ns(名字空间),actions(方法集合) 字段");
        }
        var methods_1 = { ns: model.ns, mt: {} };
        var actions_1 = {};
        Object.keys(model.actions).forEach(function (key) {
            var originFn = model.actions[key];
            actions_1[key] = function (context, payload) {
                // fix：outer catch promise reject
                return originFn.bind(context)(payload, context);
            };
            // @ts-ignore
            methods_1[key] = function (payload) {
                if (arguments.length > 1) {
                    throw new Error("参数传递错误， 不能传多个参数， 建议全部参数放入第一个参数中");
                }
                return _store.dispatch(model.ns + "/" + key, payload);
            };
        });
        Object.keys(model.mutations).forEach(function (key) {
            methods_1.mt[key] = function (payload) {
                _store.commit(model.ns + "/" + key, payload);
            };
        });
        var state = _store.state[model.ns] || model.state || {};
        if (_store.state[model.ns]) {
            _store.unregisterModule(model.ns);
        }
        _store.registerModule(model.ns, {
            namespaced: true,
            mutations: model.mutations || {},
            actions: actions_1,
            state: state,
            getters: model.getters || {}
        });
        return methods_1;
    }
    else {
        throw new Error("v-vuex 未初始化, 请先调用 v-vuex(store)");
    }
};
exports.default = (function (store) {
    _store = store;
});
//# sourceMappingURL=index.js.map