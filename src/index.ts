let _store: Store;
interface Store {
  dispatch: (actionType: string, payload?: any) => any;
  commit: (mtype: string, payload?: any) => any;
  registerModule: any;
  state: object;
  unregisterModule: any;
}
interface Context {
  commit: (mutationName: string, payload?: any) => any;
  dispatch: (actionType: string, payload?: any) => any;
  getters: any;
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
}
export const connect = <T extends Actions, K extends Mutations>(model: {
  ns: string;
  getters?: object;
  mutations?: K;
  actions: T;
  state?: object;
}): T | Result<K> => {
  if (_store) {
    if (!model.ns || !model.actions) {
      throw new Error(
        "model 不符合规范，至少需要包含ns(名字空间),actions(方法集合) 字段"
      );
    }

    const methods = { ns: model.ns, mt: {} } as T | Result<K>;
    const actions = {};

    Object.keys(model.actions).forEach(key => {
      const originFn = model.actions[key];
      actions[key] = (context: Context, payload) => {
        // fix：outer catch promise reject
        return originFn.bind(context)(payload, context);
      };

      // @ts-ignore
      methods[key] = function(payload) {
        if (arguments.length > 1) {
          throw new Error(
            "参数传递错误， 不能传多个参数， 建议全部参数放入第一个参数中"
          );
        }
        return _store.dispatch(`${model.ns}/${key}`, payload);
      };
    });

    Object.keys(model.mutations).forEach(key => {
      methods.mt[key] = payload => {
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
  } else {
    throw new Error("v-vuex 未初始化, 请先调用 v-vuex(store)");
  }
};
export default (store: Store) => {
  _store = store;
};
