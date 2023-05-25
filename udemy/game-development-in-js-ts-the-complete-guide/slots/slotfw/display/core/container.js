import * as PIXI from "pixi.js";

export default class Container extends PIXI.Container {
  constructor(data) {
    super(data);
    console.log("Container");
  }
}
