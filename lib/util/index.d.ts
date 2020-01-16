/**
 * 扁平化转成对象数组
 * @param {Array|Object} map
 * @return {Object} array
 */
interface Obj {
    [key: string]: any;
}
export declare function normalizeMap(map: Obj | string[]): object[];
export declare const isGenerator: (func: any) => boolean;
export declare const isArray: (arr: any) => boolean;
export declare const isFunc: (fn: any) => boolean;
export {};
