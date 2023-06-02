import Phaser from "phaser";

const config = {
	type: Phaser.AUTO, //default browser is webGL (web graphics library)
	width: 800,
	height: 600,
	// Arcade physics plugin, manages physics simulation
	physics: {
		// Arcade physics plugin, manages physics simulation
		default: "arcade",
		arcade: {
			// gravity: {
			//   y: 400
			// },
			debug: true,
		},
	},
	scene: {
		preload: preload,
		create: create,
		update: update, //is called every frame
	},
};

const VELOCITY = 200;
const PIPES_TO_RENDOR = 4
let bird = null;
let pipe = null;
let pipeHorizontalDistance = 0;

const pipeOpeningDistanceRange = [150, 250];
let pipeVerticalDistance = Phaser.Math.Between(...pipeOpeningDistanceRange); //random between this range
let pipeVerticalPosition = Phaser.Math.Between(0 + 20,config.height - 20 - pipeVerticalDistance);

const flapVelocity = 250;
const initialBirdPosition = { x: config.width * 0.1, y: config.height / 2 };
//let totalDelta = null;

//loading assets, such as images, music, animations
function preload() {
	//this context = scene
	//contains functions and properties we can use
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
	bird.body.gravity.y = 400;

	for(let i = 0; i < PIPES_TO_RENDOR; i++){
		const upperPipe = this.physics.add
			.sprite(0, 0, "pipe")
			.setOrigin(0, 1);

		const lowerPipe = this.physics.add
			.sprite(0, 0 + pipeVerticalDistance, "pipe")
			.setOrigin(0, 0);
		
		placePipe(upperPipe, lowerPipe)
	}

	this.input.on("pointerdown", flap);

	this.input.keyboard.on("keydown-SPACE", flap);
}

//gravity
// t0 = 0px/s
// t1 = 200px/s
// t2 = 400px/s
// t3 = 600px/s ...

// around 60fps
// 60 timers be second this will be executed
// delta time is from the last frame, delata is around 16ms
// 60 * 16ms = roughly around 1000ms
function update(time, delta) {
	// let num = 0
	// console.log(`hello${num++}`)

	// if(totalDelta >= 1000){
	//   console.log(bird.body.velocity.y);
	//   totalDelta = 0;
	// }
	// totalDelta  += delta;

	// totalDelta += delta;
	// if (totalDelta < 1000) {return;}
	// console.log(bird.body.velocity.y);
	// totalDelta = 0;

	// if(bird.x >= config.width - bird.body.width){
	//   bird.body.velocity.x = -200;
	// }else if(bird.x <= 0){
	//   bird.body.velocity.x = 200
	// }

	if (bird.y > config.height || bird.y - bird.height < 0) {
		restartBirdPosition();
	}
}
function placePipe(uPipe, lPipe){
	pipeHorizontalDistance += 400;
	let pipeVerticalDistance = Phaser.Math.Between(...pipeOpeningDistanceRange); //random between this range
	let pipeVerticalPosition = Phaser.Math.Between(0 + 20,config.height - 20 - pipeVerticalDistance);

	uPipe.x = pipeHorizontalDistance;
	uPipe.y = pipeVerticalDistance;

	lPipe.x = uPipe.x;
	lPipe.y = uPipe.y + pipeVerticalDistance;

	uPipe.body.velocity.x = -200;
	lPipe.body.velocity.x = -200;
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
