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

const VELOCITY = 200;
const PIPES_TO_RENDOR = 4

let bird = null;
let pipes = null;

const pipeVerticalDistanceRange = [150, 250];
const pipeHorizontalDistanceRange = [500,550];
const pipeHorizontalDistance = Phaser.Math.Between(...pipeHorizontalDistanceRange);

const flapVelocity = 250;
const initialBirdPosition = { x: config.width * 0.1, y: config.height / 2 };

//loading assets, such as images, music, animations
function preload() {
	this.load.image("sky", "assets/sky.png");
	this.load.image("bird", "assets/bird.png");
	this.load.image("pipe", "assets/pipe.png");
}

//initalising object, interactions etc
function create() {
	this.add.image(0, 0, "sky").setOrigin(0, 0);
	
	bird = this.physics.add
		.sprite(initialBirdPosition.x, initialBirdPosition.y, "bird")
		.setOrigin(0);

	//bird.body.gravity.y = 400;

	pipes = this.physics.add.group();

	for(let i = 0; i < PIPES_TO_RENDOR; i++){
		// const upperPipe = this.physics.add
		// 	.sprite(0, 0, "pipe")
		// 	.setOrigin(0, 1);

		// const lowerPipe = this.physics.add
		// 	.sprite(0, 0 + pipeVerticalDistance, "pipe")
		// 	.setOrigin(0, 0);

		//will create a sprite and add it into pipes group
    	const upperPipe = pipes.create(0, 0, 'pipe').setOrigin(0, 1);
    	const lowerPipe = pipes.create(0, 0, 'pipe').setOrigin(0, 0);
		
		placePipe(upperPipe, lowerPipe)
	}

	pipes.setVelocityX(-200);

	this.input.on("pointerdown", flap);
	this.input.keyboard.on("keydown-SPACE", flap);
}

// around 60fps
// 60 timers be second this will be executed
// delta time is from the last frame, delata is around 16ms
// 60 * 16ms = roughly around 1000ms
function update(time, delta){
	if (bird.y > config.height || bird.y - bird.height < 0) {
		restartBirdPosition();
	}

	recyclePipes()
}

function placePipe(uPipe, lPipe){
	const rightMostX = getRightMostPipe();
	
	//pipeHorizontalDistance.getRightMostPipe();
 	const pipeVerticalDistance = Phaser.Math.Between(...pipeVerticalDistanceRange);
	const pipeVerticalPosition = Phaser.Math.Between(0 + 20, config.height - 20 - pipeVerticalDistance);

	uPipe.x = rightMostX + pipeHorizontalDistance;
	uPipe.y = pipeVerticalDistance;

	lPipe.x = uPipe.x;
	lPipe.y = uPipe.y + pipeVerticalDistance;
}

function recyclePipes(){
	const tempPipes = []
	pipes.getChildren().forEach(pipe => {
		if(pipe.getBounds().right < 0){ //soon as the bounds is out of range of scene
			//recycle pipe
			//get upper piep are out of the bounds
			tempPipes.push(pipe)
			if(tempPipes.length ===2){
				placePipe(...tempPipes)
			}
		}
	})
}

function getRightMostPipe(){
	let rightMostX = 0;

	//iterates of the pipes group children, gets last one's x position
	pipes.getChildren().forEach(function(pipe){
		rightMostX = Math.max(pipe.x, rightMostX)
	})

	return rightMostX;
}

function restartBirdPosition() {
	bird.x = initialBirdPosition.x;
	bird.y = initialBirdPosition.y;
	bird.body.velocity.y = 0;
}

function flap() {
	console.log("flap");
	bird.body.velocity.y = -flapVelocity;
}

new Phaser.Game(config);
