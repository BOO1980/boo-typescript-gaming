import DEFAULTS from "./configManager.json";
import Utils from "../utils/utils";

export default class ConfigManager {
  constructor() {
    if (ConfigManager.exists) {
      return ConfigManager.instance;
    }

    ConfigManager.instance = this;
    ConfigManager.exists = true;
    this.config = Utils.merge(DEFAULTS, {});
  }

  getConfig(key, clone = true) {
    let data = this.config[key];
    if (clone === true && Utils.isObject(this.config[key])) {
      data = Utils.merge(this.config[key], {});
    } else if (clone === true && Utils.isArray(this.config[key])) {
      data = Utils.merge(this.config[key], []);
    }
    return data;
  }
}
