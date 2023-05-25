export default class Game extends HoneyPot.Game {
  constructor(initData) {
    super(initData);
  }

  setupEventListener() {
    super.setupEventListener();

    this.registerGameEvents();

    // this needs to be turned off and on some how
    // and deffo cant be part of the final release build
    HoneyPot.AppEventListener.addEventListener(
      HoneyPot.eventsDictionary.browserEvents.KEYUP_DETECTED,
      (data) => {
        this.onKeyUp(data);
      }
    );
  }

  // eslint-disable-next-line class-methods-use-this
  registerGameEvents() {
    HoneyPot.AppEventListener.registerEvent("GAME_INTRO_PANEL_REMOVED");
  }

  async setupGraphicsDriver() {
    await super.setupGraphicsDriver();
    globalThis.__PIXI_APP__ = this.app.app;
  }

  onKeyUp(data) {
    if (this.paused === false) {
      if (data.key === "+") {
        if (this.gameSpeedModifier < 5) {
          this.setGameSpeedModifier(this.gameSpeedModifier + 0.1);
        }
      } else if (data.key === "-") {
        if (this.gameSpeedModifier > 0) {
          this.setGameSpeedModifier(this.gameSpeedModifier - 0.1);
        }
      } else if (data.key === "0") {
        this.setGameSpeedModifier(0);
      } else if (data.key === "1") {
        this.setGameSpeedModifier(1);
      } else if (data.key === "2") {
        this.setGameSpeedModifier(2);
      } else if (data.key === "3") {
        this.setGameSpeedModifier(3);
      } else if (data.key === "4") {
        this.setGameSpeedModifier(4);
      } else if (data.key === "5") {
        this.setGameSpeedModifier(5);
      } else if (data.key === "6") {
        this.setGameSpeedModifier(6);
      } else if (data.key === "7") {
        this.setGameSpeedModifier(7);
      } else if (data.key === "8") {
        this.setGameSpeedModifier(8);
      } else if (data.key === "9") {
        this.setGameSpeedModifier(9);
      }
    }
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    // eslint-disable-next-line no-undef
    const game = new Game(GAME_INIT_DATA);
    game.init();
  },
  { once: true }
);
