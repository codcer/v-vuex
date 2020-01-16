"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const redux_saga_1 = require("redux-saga");
const util_1 = require("./util");
let _store;
let _channel;
function mapSagaActions(actions) {
    const res = {};
    util_1.normalizeMap(actions).forEach(({ key, val }) => {
        res[key] = function mappedSagaAction(...args) {
            const { sagaDispatch } = this.$store;
            return typeof val === "function"
                ? val.apply(this, [sagaDispatch].concat(args))
                : sagaDispatch.apply(this.$store, [val].concat(args));
        };
    });
    return res;
}
exports.mapSagaActions = mapSagaActions;
/**
 * 调用saga必须初始化此方法，并注入至vuex plugin中
 * @param {Array} sagas: saga方法的数组
 * @param args: runSaga可接受的其它参数
 * @return {Function}
 */
function VuexSaga(_a) {
    var { sagas } = _a, args = __rest(_a, ["sagas"]);
    if (!util_1.isFunc(sagas) &&
        util_1.isArray(sagas) &&
        !sagas.every((r) => util_1.isGenerator(r))) {
        throw new Error("`VuexSaga(sagas, ...args)`: sagas 参数必须是一个Generator方法 or Generator方法数组!");
    }
    if (!util_1.isArray(sagas)) {
        sagas = [sagas];
    }
    return (store) => {
        _store = store;
        _channel = redux_saga_1.stdChannel();
        // 注入sagaDispatch方法; 触发action generator
        _store.sagaDispatch = (type, payload) => _channel.put({ type, payload });
        sagas.forEach((saga) => {
            redux_saga_1.runSaga(Object.assign({ channel: _channel, dispatch: (output) => {
                    const { type } = output, payload = __rest(output, ["type"]);
                    _store.commit(type, payload);
                }, getState: () => _store.state }, args), saga);
        });
    };
}
exports.default = VuexSaga;
exports.run = (sagas, ...args) => {
    if (!_store || !_channel) {
        throw new Error("vuex Saga运行前, 必须注册vuex的store中的plugin参数初始化!");
    }
    if (!util_1.isFunc(sagas) &&
        util_1.isArray(sagas) &&
        !sagas.every((r) => util_1.isGenerator(r))) {
        throw new Error("`sagaPlugin.run(sagas, ...args)`: sagas 参数必须是一个Generator方法 or Generator方法数组!");
    }
    if (!util_1.isArray(sagas)) {
        sagas = [sagas];
    }
    sagas.forEach((saga) => {
        redux_saga_1.runSaga(Object.assign({ channel: _channel, dispatch: (output) => {
                const { type } = output, payload = __rest(output, ["type"]);
                _store.commit(type, payload);
            }, getState: () => _store.state }, args), saga);
    });
};
// 暴露连接vue/vuex方法，，类似react-redux，此工具也是这个方向
exports.connect = (model) => {
    if (!_store) {
        throw new Error("v-vuex 未初始化, 请先调用 v-vuex(store)");
    }
    if (!model.ns || !model.actions) {
        throw new Error("model 不符合规范，至少需要包含ns(名字空间),actions(方法集合) 字段");
    }
    // const methods = { ns: model.ns, mt: {} } as T | Result<K>;
    const methods = { ns: model.ns, mt: {} };
    const actions = {};
    const _actions = model.actions;
    const _vuex_actions = {}; // 普通的vuex action组
    const _saga_actions = {}; // sagas action组
    // 分离saga｜普通action
    Object.keys(_actions).forEach(key => {
        const _fn = _actions[key];
        if (typeof _fn !== "function") {
            throw new Error("model 不符合规范，actions需(普通方法或者Generator方法集合)字段");
        }
        if (util_1.isGenerator(_fn)) {
            _saga_actions[key] = _fn;
        }
        else {
            _vuex_actions[key] = _fn;
        }
    });
    // saga actions
    Object.keys(_saga_actions).forEach(key => {
        const originGenFn = function (payload) {
            exports.run([_saga_actions[key].bind(null, payload)]); // fix: saga入参问题
        };
        actions[key] = (context, payload) => {
            return originGenFn.bind(context, payload);
        };
        methods[key] = function (payload) {
            if (arguments.length > 1) {
                throw new Error("参数传递错误， 不能传多个参数， 建议全部参数放入第一个参数中");
            }
            return _store.dispatch(`${model.ns}/${key}`, payload);
        };
        methods[key] = function (payload) {
            if (arguments.length > 1) {
                throw new Error("参数传递错误， 不能传多个参数， 建议全部参数放入第一个参数中");
            }
            // _store.sagaDispatch = (type, payload) => _channel.put({ type, payload });
            return _store.dispatch(`${model.ns}/${key}`, payload).then(gen => {
                console.log(typeof gen, gen, gen.prototype.next);
                exports.run([gen]);
            });
        };
    });
    // 普通actions
    Object.keys(_vuex_actions).forEach(key => {
        const originFn = _vuex_actions[key];
        actions[key] = (context, payload) => {
            // fix：outer catch promise reject
            return originFn.bind(context)(payload, context);
        };
        methods[key] = function (payload) {
            if (arguments.length > 1) {
                throw new Error("参数传递错误， 不能传多个参数， 建议全部参数放入第一个参数中");
            }
            return _store.dispatch(`${model.ns}/${key}`, payload);
        };
    });
    Object.keys(model.mutations).forEach((key) => {
        methods.mt[key] = (payload) => {
            _store.commit(`${model.ns}/${key}`, payload);
        };
    });
    const state = _store.state[model.ns] || model.state || {};
    if (_store.state[model.ns]) {
        _store.unregisterModule(model.ns);
    }
    _store.registerModule(model.ns, {
        namespaced: true,
        mutations: model.mutations || {},
        actions,
        state,
        getters: model.getters || {}
    });
    return methods;
};
//# sourceMappingURL=index.js.map