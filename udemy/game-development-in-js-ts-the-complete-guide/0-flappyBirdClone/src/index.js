import Phaser from "phaser";
import PlayScene from "./scenes/playScene";

const WIDTH = 800;
const HEIGHT = 600;
const BIRD_POSITION = {x: WIDTH*0.1, y: HEIGHT/2}

const SHARED_CONFIG ={
	width: WIDTH,
	height: HEIGHT,
	startPosition: BIRD_POSITION
}
const config = {
	type: Phaser.AUTO, //default browser is webGL (web graphics library)
	...SHARED_CONFIG,
	physics: {
		default: "arcade", // Arcade physics plugin, manages physics simulation
		arcade: {
			debug: true,
		},
	},
	scene: [new PlayScene(SHARED_CONFIG)]
};

//loading assets, such as images, music, animations
function preload() {
	this.load.image("sky", "assets/sky.png");
	this.load.image("bird", "assets/bird.png");
}


new Phaser.Game(config);
