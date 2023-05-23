import Container from "./container";
import Sprite from "./sprite";
import Utils from "../../utils/utils";
export default class QuarteredBackground extends Container {
  constructor(data) {
    if (!Utils.isObject(data)) {
      data = {};
    }
    super(data);
    console.log("QuarteredBackground: constructor");

    this.tl = new Sprite(data.tl);
    this.tr = new Sprite(data.tr);
    this.bl = new Sprite(data.bl);
    this.br = new Sprite(data.br);
  }
}
