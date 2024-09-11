// ************
// SETUP
// ************

let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

const scale = window.devicePixelRatio;  
ctx.scale(scale, scale);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ************
// CONFIGURATION
// ************

// UI Values
const textSize = 80; // in px

// Game settings
const framesPerSecond = 30;
const gameLives = 3;

// Points
const saveScore = "highScore"; // save key for local storage

// ************
// INTRO SCREEN
// ************

// Title
ctx.fillStyle = "rgba(193,193,193,1.00)";
ctx.font = "small-caps " + textSize + "px monospace";
ctx.textAlign   = "center";
ctx.fillText("ASTRO ASSAULT", canvas.width / 2, canvas.height / 2);

// New game prompt
ctx.font = "small-caps " + (textSize / 2) + "px monospace";
ctx.fillText("PRESS ANY KEY TO START", canvas.width / 2, canvas.height / 2 + textSize);
document.addEventListener("keydown", newGame);


// ************
// START NEW GAME
// ************

function newGame () {
  // Clean up
  ctx.clearRect(0, 0, canvas.width, canvas.height); 
	document.removeEventListener("keydown", newGame);

  console.log("New game started")
}
