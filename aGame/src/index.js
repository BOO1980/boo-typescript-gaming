export default class Game extends BooFW.Game {
  constructor() {
    super();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  game.init();
});
