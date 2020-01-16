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
export declare function mapSagaActions(actions: Actions): Obj;
/**
 * 调用saga必须初始化此方法，并注入至vuex plugin中
 * @param {Array} sagas: saga方法的数组
 * @param args: runSaga可接受的其它参数
 * @return {Function}
 */
export default function VuexSaga({ sagas, ...args }: {
    [x: string]: any;
    sagas: any;
}): (store: Store) => void;
export declare const run: (sagas: any[], ...args: any[]) => void;
export declare const connect: <T extends Actions, K extends Mutations>(model: {
    ns: string;
    getters?: object;
    mutations?: K;
    actions: T;
    state?: object;
}) => T | Result<K>;
export {};
