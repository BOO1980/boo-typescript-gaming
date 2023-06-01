import Phaser from "phaser";

const config = {
  type: Phaser.AUTO, //default browser is webGL (web graphics library)
  width: 800,
  height: 600,
  // Arcade physics plugin, manages physics simulation
  physics: {
    // Arcade physics plugin, manages physics simulation
    default: 'arcade',
    arcade:{
      gravity: {
        y: 200
      }
    }
  },
  scene: {
  preload: preload,
  create:create,
  update: update //is called every frame
  }
}

let bird = null;
let totalDelta = null;

//loading assets, such as images, music, animations
function preload(){
  //this context = scene
  //contains functions and properties we can use
  this.load.image('sky','assets/sky.png');
  this.load.image('bird','assets/bird.png');
}

//initalising object, interactions etc
function create(){
  
  //this.add.image(x,y,'keyname');
  //this.add.image(config.width/2,config.height/2,'sky');
  this.add.image(0,0,'sky').setOrigin(0,0);
  //bird = this.add.sprite(config.width/10, config.height/2,'bird').setOrigin(0,0)
  bird = this.physics.add.sprite(config.width * 0.1, config.height / 2, 'bird').setOrigin(0)
  console.log(bird.body);
  //bird.body.gravity.y = 200; //down 200 pixels per second (higher the number the much faster it will go)
  bird.body.gravity.y = 200;
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
function update(time, delta){
  // let num = 0
  // console.log(`hello${num++}`)

  // if(totalDelta >= 1000){
  //   console.log(bird.body.velocity.y);
  //   totalDelta = 0;
  // }
  // totalDelta  += delta;

  totalDelta += delta;
  if (totalDelta < 1000) {return;}
  console.log(bird.body.velocity.y);
  totalDelta = 0;
}

new Phaser.Game(config);



