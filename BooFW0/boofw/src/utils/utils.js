// https://www.npmjs.com/package/deepmerge
const deepmerge = require("deepmerge");
// eslint-disable-next-line import/no-extraneous-dependencies
const isPlainObject = require("is-plain-object");

export default class Utils {
  static isObject(obj) {
    let result = false;
    if (obj) {
      result = Object.getPrototypeOf(obj) === Object.getPrototypeOf({});
    }
    return result;
  }

  static merge(defaultData, ...customDatas) {
    customDatas.unshift(defaultData);
    const filteredCustomDatas = customDatas.filter((obj) => {
      return Utils.isObject(obj);
    });
    return deepmerge.all(filteredCustomDatas, {
      isMergeableObject: isPlainObject,
    });
  }
}
