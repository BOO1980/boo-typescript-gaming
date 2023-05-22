import Container from "./container";

export default class Screen extends Container {
  constructor(data) {
    super(data);
    console.log("Screens: constructor");
  }
}
