// https://www.npmjs.com/package/deepmerge
const deepmerge = require("deepmerge");
// eslint-disable-next-line import/no-extraneous-dependencies
const isPlainObject = require("is-plain-object");

export default class Utils {
  static isObject(obj) {
    console.log("Utils: isObject");
    let result = false;
    if (obj) {
      result = Object.getPrototypeOf(obj) === Object.getPrototypeOf({});
    }
    return result;
  }

  static merge(defaultData, ...customDatas) {
    console.log("Utils: merge");

    customDatas.unshift(defaultData);
    const filteredCustomDatas = customDatas.filter((obj) => {
      return Utils.isObject(obj);
    });
    return deepmerge.all(filteredCustomDatas, {
      isMergeableObject: isPlainObject,
    });
  }

  static mergeAndValidate(defaultData, ...customDatas) {
    console.log("Utils: mergeAndValidate");
    return Utils.validateData(
      defaultData,
      Utils.merge(defaultData, ...customDatas)
    );
  }

  static validateData(defaultData, customData) {
    console.log("Utils: validateData");
    // we can only use defaultData to validate against, if the developer add new properties
    // we will have to assume those are correct and let the dev check those
    const keys = Object.keys(defaultData);
    const validatedData = { ...customData }; // so we can leave the original as is
    for (let i = 0; i < keys.length; i++) {
      // check both objects have the same property
      if (
        defaultData.hasOwnProperty(keys[i]) &&
        validatedData.hasOwnProperty(keys[i])
      ) {
        if (
          Utils.isObject(defaultData[keys[i]]) &&
          Utils.isObject(validatedData[keys[i]])
        ) {
          // both are objects - lets go and validate these objects
          validatedData[keys[i]] = Utils.validateData(
            defaultData[keys[i]],
            validatedData[keys[i]]
          );
        } else if (
          Utils.isNull(defaultData[keys[i]]) ||
          Utils.isNull(validatedData[keys[i]])
        ) {
          // either one of these is null, so ignore this property
          // default is null for a reason, or custom is null because they are disabling something
        } else if (
          Utils.isFunction(defaultData[keys[i]]) &&
          Utils.isFunction(validatedData[keys[i]])
        ) {
          // both are functions
        } else if (
          typeof defaultData[keys[i]] === typeof validatedData[keys[i]]
        ) {
          // types match
        } else {
          // mismatch
          // we need to replace validatedData with default
          validatedData[keys[i]] = defaultData[keys[i]];
        }
      }
    }
    return validatedData;
  }

  static isNull(val) {
    console.log("Utils: isNull");
    let result = false;
    if (val === null) {
      result = true;
    }
    return result;
  }

  static isFunction(func) {
    console.log("Utils: isFunction");
    let result = false;
    if (func) {
      result =
        toString.call(func) === "[object Function]" ||
        toString.call(func) === "[object AsyncFunction]";
    }
    return result;
  }
}
