//import * as PIXI from "pixi.js"; //1
import Container from "../display/core/container"; //4
import QuarteredBackground from "../display/core/quarteredBackground"; //5
import Sprite from "../display/core/sprite"; //7
import Screen from "../display/core/screen"; //12
import ReelScreen from "../display/screens/reelScreen"; //16
import Utils from "../utils/utils"; //42
import BaseGameFlow from "../flow/baseGameFlow"; //58
import { configManager } from "../index"; //74

export default class CreationFactory {
  constructor() {
    console.log("CreationFactory: constructor");
  }

  static classesDirectory = {
    Container,
    QuarteredBackground,
    Screen,
    ReelScreen,
    BaseGameFlow,
  };

  static create(type, data) {
    console.log("CreationFactory: create");
    try {
      if (Array.isArray(data)) {
        return new CreationFactory.classesDictionary[type](...data);
      }
      return new CreationFactory.classesDictionary[type](data);
    } catch (error) {
      console.log(`please add ${type} to the creating factory`);
      console.log(error);
    }
  }
}
