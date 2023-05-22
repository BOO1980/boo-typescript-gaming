import * as PIXI from "pixi.js";

export default class Container extends PIXI.Container {
  constructor(data) {
    if (!Utils.isObject(data)) {
      data = {};
    }
    super(data);
    console.log("Container: constructor");
  }
}
