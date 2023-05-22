export class Game {
  constructor() {
    console.log("FW: Game");
    if (Game.exists) {
      return Game.instance;
    }
    Game.instance = this;
    Game.exists = true;

    this.hbGameContainer = document.getElementById("hbGameContainer"); //aGame index.html

    return this;
  }

  init() {
    console.log("Game: init");
    const gameConfig = configManager.getConfig("game");
  }
}
