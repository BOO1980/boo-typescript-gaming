import Phaser from "phaser";

const config = {
  //specify height and width of canvas
  type: Phaser.AUTO, //default renderer for application WebGL (this is part of almost every broweser (WebGraphicsLibrarty) 2D and 3D)
  width: 800,
  height: 600,
  physics: {
    // arcase physics plugin, manage physic similation
    default: "arcade",
  },
  scene: {
    preload,
    create,
    //:update,
  },
};

function preload() {}

function create() {}
//create an instance of the phaser game
new Phaser.Game(config);
