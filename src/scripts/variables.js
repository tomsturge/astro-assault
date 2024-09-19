// *****
// Variables
// *****

/* Defaults values */
let screen = "intro";
let musicOn = false;
let gameTime = 0;
let level, roids, ship, lives, score, text, textAlpha;

/* UI Values */
const textSize = 180; // in px
const textFadeTime = 3; // in seconds
const fontFamily = "micro5";
const bgColor = "#2c2c2c";
const redColor = "#c37272";
const whiteColor = "#bfbfbf";
const whiteColorRgb = `${parseInt(whiteColor.substring(1, 3), 16)}, ${parseInt(whiteColor.substring(3, 5), 16)}, ${parseInt(whiteColor.substring(5, 7), 16)}`;
const redColorRgb = `${parseInt(redColor.substring(1, 3), 16)}, ${parseInt(redColor.substring(3, 5), 16)}, ${parseInt(redColor.substring(5, 7), 16)}`;

/* Game settings */
const framesPerSecond = 30;
const friction = 0.5; // friction coefficient of space
const gameLives = 3; // times a player can explode
const shipSize = canvas.height / 42; // height in based on screen height
const shipThrust = 5; // acceleration of the ship px per sec
const shipTurnSpeed = 360; // degrees per second
const shipExplodeDuration = 0.3; // how long the explosion lasts
const laserDist = 0.4; // max distance laser can travel
const laserExplodeDuration = 0.1;
const laserMax = 10; // max num of lasers on screen at once
const laserSpeed = 500; // px per sec
const roidsJag = 0.3; //jaggedness of the asteroids
const roidsNum = 4; // starting number of asteroids
const roidsSize = canvas.height / 20; // starting size of asteroids based on screen height
const roidsSpeed = 50; // max px per second
const roidsVert = 10; // average number of asteroid vertices
const roidsLargePts = 10; // points scored for large asteroid
const roidsMediumPts = 20; // points scored for medium asteroid
const roidsSmallPts = 40; // points scored for small asteroid
const thrusterCenterOffset = 0.45; // How far back the thruster is from the ship's center
const thrusterWidth = 0.6; // Width of the thruster flame
const thrusterLength = 1.2; // Length of the thruster flame
const thrusterCoreSize = 0.4; // Size of the bright core
const thrusterBaseWidth = 0.2; // Width of the flame at its base

/* Points */
const saveScore = "highScore"; // save key for local storage
let highScore = localStorage.getItem(saveScore);
