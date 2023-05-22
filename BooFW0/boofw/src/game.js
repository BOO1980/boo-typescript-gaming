import { configManager } from "./index";
import CreationFactory from "./helpers/creationFactory";
import Utils from "./utils/utils";

export class Game {
  constructor() {
    console.log("FW: Game");
    if (Game.exists) {
      return Game.instance;
    }
    Game.instance = this;
    Game.exists = true;

    this.screens = [];
    this.connection = null;
    this.gameUI = null;

    this.hbGameContainer = document.getElementById("hbGameContainer"); //aGame index.html

    return this;
  }

  init() {
    console.log("Game: init");
    const gameCfg = configManager.getConfig("game");
    if (gameCfg.gameType !== "slotmasters") {
      this.setupGameFlow();
    }
  }

  setupGameFlow() {
    console.log("Game: setup gameflow");
    const flowInitData = Utils.merge(
      {
        config: this.config,
        connection: this.connection,
        gameUI: this.gameUI,
        screens: this.screens,
        game: this,
        //freeRoundsManager: this.freeRoundsManager,
      },
      configManager.getConfig("gameFlow")
    );

    this.gameFlow = this.createNewGameFlow(flowInitData.type, flowInitData);
  }

  createNewGameFlow(type, initData) {
    return CreationFactory.create(type, initData);
  }
}
