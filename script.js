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
const whiteColorRgb = `${parseInt(whiteColor.substring(1, 3), 16)}. ${parseInt(whiteColor.substring(3, 5), 16)}, ${parseInt(whiteColor.substring(5, 7), 16)}`;
const redColorRgb = `${parseInt(redColor.substring(1, 3), 16)}. ${parseInt(redColor.substring(3, 5), 16)}, ${parseInt(redColor.substring(5, 7), 16)}`;

/* Game settings */
const framesPerSecond = 30;
const friction = 0.5; // friction coefficient of space
const gameLives = 3;
const shipSize = 30; // height in pixels
const shipThrust = 5; // acceleration of the ship px per sec
const shipTurnSpeed = 360; // degrees per second
const roidsJag = 0.3; //jaggedness of the asteroids
const roidsNum = 8; // starting nb of asteroids
const roidsSize = 60; // starting size of asteroids in px
const roidsSpeed = 50; // max px per second
const roidsVert = 10; // average nb of vertices on each asteroid

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
const drawShip = (x, y, a, color = whiteColor) => {
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
// Draw thruster
// *****
const drawThruster = () => {
  ctx.strokeStyle = whiteColor;
  ctx.lineWidth = shipSize / 10;
  ctx.beginPath();
  // left
  ctx.moveTo(
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a)),
  );
  // center, behind the ship
  ctx.lineTo(
    ship.x - ship.r * ((5 / 3) * Math.cos(ship.a)),
    ship.y + ship.r * ((5 / 3) * Math.sin(ship.a)),
  );
  // right
  ctx.lineTo(
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a)),
  );
  ctx.closePath();
  ctx.stroke();
};

// *****
// New Asteroid
// *****
const newAsteroid = (x, y, r) => {
  let lvlMultiply = 1 + 0.1 * level;
  let roid = {
    x: x,
    y: y,
    xv:
      ((Math.random() * roidsSpeed * lvlMultiply) / framesPerSecond) *
      (Math.random() < 0.5 ? 1 : -1),
    yv:
      ((Math.random() * roidsSpeed * lvlMultiply) / framesPerSecond) *
      (Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2, // in radians
    vert: Math.floor(Math.random() * (roidsVert + 1) + roidsVert / 2),
    offs: [],
  };

  // Create the vertex offset array
  for (let i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * roidsJag * 2 + 1 - roidsJag);
  }

  return roid;
};

// *****
// Create asteroid cluster
// *****
const createAsteroidCluster = () => {
  roids = [];
  roidsTotal = (roidsNum + level) * 7;
  roidsLeft = roidsTotal;

  let x, y;
  for (let i = 0; i < roidsNum + level; i++) {
    do {
      x = Math.floor(Math.random() * canvas.width);
      y = Math.floor(Math.random() * canvas.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < roidsSize * 2 + ship.r);
    roids.push(
      newAsteroid(
        x,
        y,
        Math.ceil(
          Math.floor(Math.random() * (roidsSize * 3 - roidsSize)) + roidsSize,
        ),
      ),
    );
  }
};

// *****
// Draw asteroid
// *****
const drawAsteroid = (i) => {
  ctx.fillStyle = whiteColor;
  ctx.lineWidth = shipSize / 20;

  x = roids[i].x;
  y = roids[i].y;
  r = roids[i].r;
  a = roids[i].a;
  vert = roids[i].vert;
  offs = roids[i].offs;

  // Draw path
  ctx.beginPath();
  ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));

  // Draw polygon
  for (let j = 1; j < vert; j++) {
    ctx.lineTo(
      x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
      y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert),
    );
  }
  ctx.closePath();
  ctx.fill();
};

const moveAsteroid = (i) => {
  roids[i].x += roids[i].xv;
  roids[i].y += roids[i].yv;

  handleScreenEdge(roids[i]);
};

const distBetweenPoints = (x1, y1, x2, y2) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

// *****
// Handle screen edge
// *****
const handleScreenEdge = (elem) => {
  if (elem.x < 0 - elem.r) {
    elem.x = canvas.width + elem.r;
  } else if (elem.x > canvas.width + elem.r) {
    elem.x = 0 - elem.r;
  }

  if (elem.y < 0 - elem.r) {
    elem.y = canvas.height + elem.r;
  } else if (elem.y > canvas.height + elem.r) {
    elem.y = 0 - elem.r;
  }
};

// *****
// New Level
// *****
const newLevel = () => {
  text = "Level " + (level + 1);
  textAlpha = 1.0;

  createAsteroidCluster();
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
    case 37: // Left
    case 65: // A
      ship.rotation = ((shipTurnSpeed / 180) * Math.PI) / framesPerSecond;
      break;
    // Up arrow or W
    case 38: // Up
    case 87: // W
      ship.thrusting = true;
      break;
    // Right arrow
    case 39: // Right
    case 68: // D
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
    case 37: // Left
    case 65: // A
      ship.rotation = 0;
      break;
    // Up arrow
    case 38: // Up
    case 87: // W
      ship.thrusting = false;
      break;
    // Right arrow
    case 39: // Right
    case 68: // D
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

  /* Title */
  ctx.fillStyle = redColor;
  ctx.font = `small-caps ${textSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.fillText("ASTRO ASSAULT", canvas.width / 2, canvas.height / 2);
  /* New game prompt */
  ctx.fillStyle = whiteColor;
  ctx.font = `small-caps ${textSize / 3}px ${fontFamily}`;
  ctx.fillText(
    "PRESS SPACE TO START",
    canvas.width / 2,
    canvas.height / 2 + textSize / 2,
  );

  createAsteroidCluster();
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

  /* Draw and move asteroids */
  let x, y, r, a, vert, offs;
  for (let i = 0; i < roids.length; i++) {
    drawAsteroid(i);
    moveAsteroid(i);
  }

  if (ship) {
    if (ship.thrusting && !ship.dead) {
      // Thrust the ship
      ship.thrust.x += (shipThrust * Math.cos(ship.a)) / framesPerSecond;
      ship.thrust.y -= (shipThrust * Math.sin(ship.a)) / framesPerSecond;

      drawThruster();
    } else {
      // Reduce speed when not thrusting
      ship.thrust.x -= (friction * ship.thrust.x) / framesPerSecond;
      ship.thrust.y -= (friction * ship.thrust.y) / framesPerSecond;
    }

    // Rotate the ship
    ship.a += ship.rotation;

    // Move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    handleScreenEdge(ship);
  }

  // Draw the game text
  if (textAlpha >= 0) {
    ctx.fillStyle = `rgba(${redColorRgb}, ${textAlpha})`;
    ctx.font = `small-caps ${textSize + 20}px ${fontFamily}`;
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
