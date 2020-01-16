import { runSaga, stdChannel } from "redux-saga";
import { normalizeMap, isArray, isGenerator, isFunc } from "./util";

let _store: Store;
let _channel: any;

interface Store {
  sagaDispatch: (type: string, payload?: any) => any;
  dispatch: (actionType: string, payload?: any) => any;
  commit: (mtype: string, payload?: any) => any;
  registerModule: any;
  state: object;
  unregisterModule: any;
}

interface Context {
  commit: (mutationName: string, payload?: any) => any;
  dispatch: (actionType: string, payload?: any) => any;
  getters: object;
  state: object;
  rootState: object;
}
interface Actions {
  [fname: string]: (this: Context, payload?: object, context?: Context) => any;
}
interface Mutations {
  [fname: string]: (state: object, payload?: object) => any;
}
interface Result<K> {
  ns: string;
  mt: {
    [str in keyof K]: (payload: any) => any;
  };
  [prop: string]: any;
}

/**
 * 此方法同vuex mapActions相似
 * @param {Object|Array} actions
 * @return {Object}
 */
interface Obj {
  [key: string]: any;
}
export function mapSagaActions(actions: Actions) {
  const res: Obj = {};
  normalizeMap(actions).forEach(({ key, val }: Obj) => {
    res[key] = function mappedSagaAction(...args: any[]) {
      const { sagaDispatch } = this.$store;
      return typeof val === "function"
        ? val.apply(this, [sagaDispatch].concat(args))
        : sagaDispatch.apply(this.$store, [val].concat(args));
    };
  });
  return res;
}

/**
 * 调用saga必须初始化此方法，并注入至vuex plugin中
 * @param {Array} sagas: saga方法的数组
 * @param args: runSaga可接受的其它参数
 * @return {Function}
 */
export default function VuexSaga({ sagas, ...args }) {
  if (
    !isFunc(sagas) &&
    isArray(sagas) &&
    !sagas.every((r: any) => isGenerator(r))
  ) {
    throw new Error(
      "`VuexSaga(sagas, ...args)`: sagas 参数必须是一个Generator方法 or Generator方法数组!"
    );
  }

  if (!isArray(sagas)) {
    sagas = [sagas];
  }

  return (store: Store) => {
    _store = store;
    _channel = stdChannel();

    // 注入sagaDispatch方法; 触发action generator
    _store.sagaDispatch = (type, payload) => _channel.put({ type, payload });

    sagas.forEach((saga: any) => {
      runSaga(
        {
          channel: _channel,
          dispatch: (output: any) => {
            const { type, ...payload } = output;
            _store.commit(type, payload);
          },
          getState: () => _store.state,
          ...args
        },
        saga
      );
    });
  };
}

export const run = (sagas: any[], ...args: any[]) => {
  if (!_store || !_channel) {
    throw new Error(
      "vuex Saga运行前, 必须注册vuex的store中的plugin参数初始化!"
    );
  }

  if (
    !isFunc(sagas) &&
    isArray(sagas) &&
    !sagas.every((r: any) => isGenerator(r))
  ) {
    throw new Error(
      "`sagaPlugin.run(sagas, ...args)`: sagas 参数必须是一个Generator方法 or Generator方法数组!"
    );
  }

  if (!isArray(sagas)) {
    sagas = [sagas];
  }

  sagas.forEach((saga: any) => {
    runSaga(
      {
        channel: _channel,
        dispatch: (output: any) => {
          const { type, ...payload } = output;
          _store.commit(type, payload);
        },
        getState: () => _store.state,
        ...args
      },
      saga
    );
  });
};

// 暴露连接vue/vuex方法，，类似react-redux，此工具也是这个方向
export const connect = <T extends Actions, K extends Mutations>(model: {
  ns: string;
  getters?: object;
  mutations?: K;
  actions: T;
  state?: object;
}): T | Result<K> => {
  if (!_store) {
    throw new Error("v-vuex 未初始化, 请先调用 v-vuex(store)");
  }

  if (!model.ns || !model.actions) {
    throw new Error(
      "model 不符合规范，至少需要包含ns(名字空间),actions(方法集合) 字段"
    );
  }

  // const methods = { ns: model.ns, mt: {} } as T | Result<K>;
  const methods = { ns: model.ns, mt: {} };
  const actions: Obj = {};
  const _actions: Obj = model.actions;
  const _vuex_actions: Obj = {}; // 普通的vuex action组
  const _saga_actions: Obj = {}; // sagas action组

  // 分离saga｜普通action
  Object.keys(_actions).forEach(key => {
    const _fn = _actions[key];
    if (typeof _fn !== "function") {
      throw new Error(
        "model 不符合规范，actions需(普通方法或者Generator方法集合)字段"
      );
    }

    if (isGenerator(_fn)) {
      _saga_actions[key] = _fn;
    } else {
      _vuex_actions[key] = _fn;
    }
  });

  // saga actions
  Object.keys(_saga_actions).forEach(key => {
    const originGenFn = function(payload) {
      run([_saga_actions[key].bind(null, payload)]); // fix: saga入参问题
    };

    actions[key] = (context, payload) => {
      return originGenFn.bind(context, payload);
    };

    methods[key] = function(payload) {
      if (arguments.length > 1) {
        throw new Error(
          "参数传递错误， 不能传多个参数， 建议全部参数放入第一个参数中"
        );
      }
      return _store.dispatch(`${model.ns}/${key}`, payload);
    };

    methods[key] = function(payload: any) {
      if (arguments.length > 1) {
        throw new Error(
          "参数传递错误， 不能传多个参数， 建议全部参数放入第一个参数中"
        );
      }

      // _store.sagaDispatch = (type, payload) => _channel.put({ type, payload });
      return _store.dispatch(`${model.ns}/${key}`, payload).then(gen => {
        console.log(typeof gen, gen, gen.prototype.next);
        run([gen]);
      });
    };
  });

  // 普通actions
  Object.keys(_vuex_actions).forEach(key => {
    const originFn = _vuex_actions[key];
    actions[key] = (context: Context, payload: any) => {
      // fix：outer catch promise reject
      return originFn.bind(context)(payload, context);
    };
    methods[key] = function(payload: any) {
      if (arguments.length > 1) {
        throw new Error(
          "参数传递错误， 不能传多个参数， 建议全部参数放入第一个参数中"
        );
      }
      return _store.dispatch(`${model.ns}/${key}`, payload);
    };
  });

  Object.keys(model.mutations as Mutations).forEach((key: string | number) => {
    methods.mt[key] = (payload: any) => {
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
  return methods as T | Result<K>;
};
