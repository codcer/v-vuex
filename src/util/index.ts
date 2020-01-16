/**
 * 扁平化转成对象数组
 * @param {Array|Object} map
 * @return {Object} array
 */
interface Obj {
  [key: string]: any;
}
export function normalizeMap(map: Obj | string[]): object[] {
  return Array.isArray(map)
    ? map.map(key => ({ key, val: key }))
    : Object.keys(map).map(key => ({ key, val: map[key] }));
}

// 监测是否generator方法
export const isGenerator = (func: any): boolean =>
  typeof func.prototype.next === "function";

export const isArray = (arr: any): boolean => Array.isArray(arr);

export const isFunc = (fn: any): boolean => typeof fn === "function";
