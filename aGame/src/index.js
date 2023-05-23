export default class Game extends BooFW.Game {
  constructor(initData) {
    super(initData);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new Game(GAME_INIT_DATA);
  game.init();
});
