// ============
// CONFIGURATION
// ============

// *****
// Variables
// *****

/* Defaults values */
let screen = "intro";
let musicOn = false;
let gameTime = 0;
let level, roids, ship, lives, score, highScore, text, textAlpha;

/* UI Values */
const textSize = 180; // in px
const textFadeTime = 3; // in seconds
const fontFamily = "micro5";
const bgColor = "#2c2c2c";
const redColor = "#c37272";
const whiteColor = "#bfbfbf";
const whiteColorRgb = "191, 191, 191";

/* Game settings */
const framesPerSecond = 30;
const friction = 0.5; // friction coefficient of space
const gameLives = 3;
const shipSize = 30; // height in pixels
const shipThrust = 5; // acceleration of the ship px per sec
const shipTurnSpeed = 360; // degrees per second

/* Points */
const saveScore = "highScore"; // save key for local storage

// *****
// Music
// *****

/* Audio files */
const introMusic = new Audio("assets/audio/intro-bg.mp3");
const countdownSound = new Audio("assets/audio/countdown.mp3");
const battleMusic = new Audio("assets/audio/battle-bg.mp3");

/* Adjust music playback */
introMusic.volume = 0.5;
countdownSound.volume = 0.4;
battleMusic.volume = 0.15;

/* Music storage */
const hasToggledMusic = localStorage.getItem("hasToggledMusic");

// *****
// Elements
// *****

const canvas = document.getElementById("gameCanvas");

const mainElement = document.querySelector("main");
const musicElement = document.querySelector(".music-control");
const musicPromptElement = document.querySelector(".music-prompt");

// ============
// SETUP
// ============

/* Canvas context */
const ctx = canvas.getContext("2d");
mainElement.focus();

/* Define canvas scale and size */
const scale = window.devicePixelRatio;

ctx.scale(scale, scale);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* Load custom font */
new FontFace("micro5", "url(assets/fonts/micro5.woff2)")
  .load()
  .then((font) => document.fonts.add(font));

/* Hide music prompt if user has toggled music */
if (hasToggledMusic) {
  musicPromptElement.remove();
}

// ============
// CORE FUNCTIONS
// ============

// *****
// Clear Screen
// *****
const clearScreen = () => {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// *****
// Set new ship values
// *****
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
// Create ship
// *****
const drawShip = (x, y, a, color = "#bfbfbf") => {
  ctx.fillStyle = color;
  ctx.lineWidth = shipSize / 20;
  ctx.beginPath();
  ctx.moveTo(
    x + (5 / 3) * ship.r * Math.cos(a),
    y - (5 / 3) * ship.r * Math.sin(a),
  );
  ctx.lineTo(
    x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a)),
  );
  ctx.lineTo(
    x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a)),
  );
  ctx.closePath();
  ctx.fill();
};

// *****
// Handle ship screen edge
// *****
const handleShipScreenEdge = () => {
  if (ship.x < 0 - ship.r) {
    ship.x = canvas.width + ship.r;
  } else if (ship.x > canvas.width + ship.r) {
    ship.x = 0 - ship.r;
  }

  if (ship.y < 0 - ship.r) {
    ship.y = canvas.height + ship.r;
  } else if (ship.y > canvas.height + ship.r) {
    ship.y = 0 - ship.r;
  }
};

// *****
// New Level
// *****
const newLevel = () => {
  text = "Level " + (level + 1);
  textAlpha = 1.0;

  // createAsteroidBelt();
};

// *****
// Music playing
// *****
const music = (state = true) => {
  if (musicOn && state) {
    if (!ship) {
      // Stop battle music and rest time
      battleMusic.pause();
      countdownSound.currentTime = 0;
      battleMusic.currentTime = 0;

      // Play calm intro music
      introMusic.play();
    } else {
      // Stop intro music and reset time
      introMusic.pause();
      introMusic.currentTime = 0;

      if (gameTime < 10) {
        // Start new game countdown
        countdownSound.play();

        // Delay battle music for countdown
        setTimeout(() => {
          battleMusic.play();
        }, 2900);
      } else {
        battleMusic.play();
      }
    }
  } else {
    // Stop all music and reset time
    battleMusic.pause();
    battleMusic.currentTime = 0;
    introMusic.pause();
    introMusic.currentTime = 0;
  }
};

// *****
// Music toggle state and icon
// *****
const musicToggle = () => {
  if (!hasToggledMusic) {
    localStorage.setItem("hasToggledMusic", true);
    musicPromptElement.remove();
  }

  musicElement.classList.toggle("mute");

  if (musicOn === false) {
    musicOn = true;
    music();
  } else {
    musicOn = false;
    music(false);
  }
};

// *****
// Key press handling
// *****
const keyDown = (e) => {
  if (ship && ship.dead) {
    return;
  }

  switch (e.keyCode) {
    case 32:
      if (screen === "intro") newGame();
      break;
    // Left arrow
    case 37:
      ship.rotation = ((shipTurnSpeed / 180) * Math.PI) / framesPerSecond;
      break;
    // Up arrow
    case 38:
      ship.thrusting = true;
      break;
    // Right arrow
    case 39:
      ship.rotation = ((-shipTurnSpeed / 180) * Math.PI) / framesPerSecond;
      break;
    // Toggle music
    case 77:
      musicToggle();
      break;
  }
};

// *****
// Key release handling
// *****
const keyUp = (e) => {
  switch (e.keyCode) {
    // Left arrow
    case 37:
      ship.rotation = 0;
      break;
    // Up arrow
    case 38:
      ship.thrusting = false;
      break;
    // Right arrow
    case 39:
      ship.rotation = 0;
      break;
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
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  /* Title */
  ctx.fillStyle = redColor;
  ctx.font = "small-caps " + textSize + "px " + fontFamily;
  ctx.textAlign = "center";
  ctx.fillText("ASTRO ASSAULT", canvas.width / 2, canvas.height / 2);
  /* New game prompt */
  ctx.fillStyle = whiteColor;
  ctx.font = "small-caps " + textSize / 3 + "px " + fontFamily;
  ctx.fillText(
    "PRESS SPACE TO START",
    canvas.width / 2,
    canvas.height / 2 + textSize / 2,
  );
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

  // High score from local storage
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
  clearScreen();

  if (screen === "intro") {
    gameTime = 0;
    introScreen();
  } else {
    gameTime += 1;
    drawShip(ship.x, ship.y, ship.a);
  }

  // Thrust the ship
  if (ship) {
    if (ship.thrusting && !ship.dead) {
      ship.thrust.x += (shipThrust * Math.cos(ship.a)) / framesPerSecond;
      ship.thrust.y -= (shipThrust * Math.sin(ship.a)) / framesPerSecond;
    } else {
      // Apply space friction when no thrusting
      ship.thrust.x -= (friction * ship.thrust.x) / framesPerSecond;
      ship.thrust.y -= (friction * ship.thrust.y) / framesPerSecond;
    }

    // Rotate the ship
    ship.a += ship.rotation;

    // Move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    // Handle edge of screen
    handleShipScreenEdge();
  }

  // Draw the game text
  if (textAlpha >= 0) {
    ctx.fillStyle = "rgba(" + whiteColorRgb + ", " + textAlpha + ")";
    ctx.font = "small-caps " + (textSize + 20) + "px " + fontFamily;
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
musicElement.addEventListener("click", musicToggle);

// *****
// Key bindings listener
// *****
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// *****
// Create game loop
// *****
setInterval(update, 1000 / framesPerSecond);
