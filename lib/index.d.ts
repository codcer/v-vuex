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
export declare const connect: <T extends Actions, K extends Mutations>(model: {
    ns: string;
    getters?: object;
    mutations?: K;
    actions: T;
    state?: object;
}) => T | Result<K>;
declare const _default: (store: Store) => void;
export default _default;
