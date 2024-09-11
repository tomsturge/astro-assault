let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

window.devicePixelRatio = 2;

const textSize = 80; // in px

var scale = window.devicePixelRatio;  
            
canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

// START THE GAME
	// Title
ctx.scale(scale, scale);
ctx.fillStyle = "rgba(193,193,193,1.00)";
ctx.font = "normal small-caps" + textSize + "px";
ctx.textAlign   = "center";
ctx.textBaseline = "middle";
ctx.fillText("ASTRO ASSAULT", canvas.width / 4, canvas.height / 4);