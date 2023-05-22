import DEFAULTS from "./baseGameFlow.json";

export default class BaseGameFlow {
  constructor() {
    console.log("BaseGameFlow: constructor");
    const defaultData = this.compileDefaults();
    //this.setupGameFlows();
  }

  // eslint-disable-next-line class-methods-use-this
  compileDefaults(...otherDefaults) {
    console.log("BaseGameFlow: compileDefaults");
    const defaultData = Utils.merge(DEFAULTS, ...otherDefaults, {});
    return defaultData;
  }
}
