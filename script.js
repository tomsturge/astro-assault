// ============
// CONFIGURATION
// ============

// *****
// Variables
// *****

/* Defaults values */
let screen = "intro";
let musicOn = false;
let level, roids, ship, lives, score, highScore, text, textAlpha;

/* UI Values */
const textSize = 80; // in px
const textFadeTime = 3; // in seconds

/* Game settings */
const framesPerSecond = 30;
const gameLives = 3;
const shipSize = 30; // height in pixels

/* Points */
const saveScore = "highScore"; // save key for local storage

/* Music */
const introMusic = new Audio("./audio/intro-bg.mp3");
const battleMusic = new Audio("./audio/battle-bg.mp3");
introMusic.volume = 0.5;
battleMusic.volume = 0.2;

// ============
// SETUP
// ============

/* Capture canvas */
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
document.querySelector("main").focus();

/* Define canvas scale and size */
const scale = window.devicePixelRatio;

ctx.scale(scale, scale);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ============
// CORE FUNCTIONS
// ============

// *****
// Clear Screen
// *****
const clearScreen = () => {
  ctx.fillStyle = "rgba(44,44,44,1.00)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const newShip = () => ({
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: shipSize / 2,
  a: (90 / 180) * Math.PI, // radiant
  canShoot: true,
  dead: false,
  explodeTime: 0,
  lasers: [],
  rotation: 0,
  thrusting: false,
  thrust: {
    x: 0,
    y: 0,
  },
});

// *****
// New Level
// *****
const newLevel = () => {
  text = "Level " + (level + 1);
  textAlpha = 1.0;

  // createAsteroidBelt();
};

const music = (state = true) => {
  if (musicOn && state) {
    if (!ship) {
      battleMusic.pause();
      battleMusic.currentTime = 0;
      introMusic.play();
    } else {
      introMusic.pause();
      introMusic.currentTime = 0;
      battleMusic.play();
    }
  } else {
    battleMusic.pause();
    battleMusic.currentTime = 0;
    introMusic.pause();
    introMusic.currentTime = 0;
  }
};

// SWITCH ON/OFF THE MUSIC
const musicToggle = () => {
  document.querySelector("#music").classList.toggle("mute");

  if (musicOn === false) {
    musicOn = true;
    music();
  } else {
    musicOn = false;
    music(false);
  }
};

// ============
// SCREENS
// ============

// *****
// INTRO
// *****
const introScreen = () => {
  screen = "intro";
  /* Background */
  ctx.fillStyle = "rgba(44,44,44,1.00)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  /* Title */
  ctx.fillStyle = "rgba(193,193,193,1.00)";
  ctx.font = "small-caps " + textSize + "px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ASTRO ASSAULT", canvas.width / 2, canvas.height / 2);
  /* New game prompt */
  ctx.font = "small-caps " + textSize / 2 + "px monospace";
  ctx.fillText(
    "PRESS ANY KEY TO START",
    canvas.width / 2,
    canvas.height / 2 + textSize,
  );
  document.addEventListener("keydown", newGame);
};

// *****
// New game
// *****
const newGame = () => {
  clearScreen();

  screen = "game";
  level = 0;
  score = 0;
  lives = gameLives;
  ship = newShip();

  document.removeEventListener("keydown", newGame);

  //High score from local storage
  let scoreStr = localStorage.getItem(saveScore);
  if (scoreStr === null) {
    highScore = 0;
  } else {
    highScore = parseInt(scoreStr);
  }

  newLevel();
  music();
};

// *****
// Update loop
// *****
const update = () => {
  ctx.fillStyle = "rgba(44,44,44,1.00)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (screen === "intro") {
    introScreen();
  }

  // DRAW THE GAME TEXT
  if (textAlpha >= 0) {
    ctx.fillStyle = "rgba(193, 193, 193, " + textAlpha + ")";
    ctx.font = "small-caps " + (textSize + 20) + "px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height * 0.7);
    textAlpha -= 1.0 / textFadeTime / framesPerSecond;
  }
};

// ============
// Initialise game
// ============

// *****
// Audio UI toggles
// *****
document.querySelector("#music").addEventListener("click", musicToggle);

// *****
// Create game loop
// *****
setInterval(update, 1000 / framesPerSecond);
