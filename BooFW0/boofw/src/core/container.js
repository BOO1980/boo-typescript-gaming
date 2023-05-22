import * as PIXI from "pixi.js";

export default class Container extends PIXI.Container {
  constructor() {
    super();
    console.log("Container: constructor");
  }
}
