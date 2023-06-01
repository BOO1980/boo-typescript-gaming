import Phaser from "phaser";

const config = {
  type: Phaser.AUTO, //default browser is webGL (web graphics library)
  width: 800,
  height: 600,
  // Arcade physics plugin, manages physics simulation
  physics:{defaults:"arcade"},
  scene: {
    preload: preload,
    create:create,
    //update: update //will use later
  }
}

//loading assets, such as images, music, animations
function preload(){
  //this context = scene
  //contains functions and properties we can use
  this.load.image('sky','assets/sky.png');
}

//initalising object, interactions etc
function create(){

  //this.add.image(x,y,'keyname');
  this.add.image(config.width/2,config.height/2,'sky');
}


new Phaser.Game(config);

