const canvas = document.getElementById("gameCanvas");

const mainElement = document.querySelector("main");
const musicElement = document.querySelector(".music-control");
const musicPromptElement = document.querySelector(".music-prompt");

const hasToggledMusic = localStorage.getItem("hasToggledMusic");

// ============
// SETUP
// ============

/* Canvas ctx */
const ctx = canvas.getContext("2d");

mainElement.focus();

/* Define canvas scale and size */
const scale = window.devicePixelRatio;

ctx.scale(scale, scale);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* Load custom font */
new FontFace("micro5", "url(src/fonts/micro5.woff2)")
  .load()
  .then((font) => document.fonts.add(font));

/* Hide music prompt if user has toggled music */
if (hasToggledMusic) {
  musicPromptElement.remove();
}

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
const roidsLargePts = 20; // points scored for large asteroid
const roidsMediumPts = 50; // points scored for medium asteroid
const roidsSmallPts = 100; // points scored for small asteroid
const thrusterCenterOffset = 0.45; // How far back the thruster is from the ship's center
const thrusterWidth = 0.6; // Width of the thruster flame
const thrusterLength = 1.2; // Length of the thruster flame
const thrusterCoreSize = 0.4; // Size of the bright core
const thrusterBaseWidth = 0.2; // Width of the flame at its base

/* Points */
const saveScore = "highScore"; // save key for local storage

// *****
// Music
// *****

/* Audio files */
const introMusic = new Audio("src/audio/intro.mp3");
const battleMusic = new Audio("src/audio/battle.mp3");
const explosionSound = new Audio("src/audio/explosion.mp3");
const laserSound = new Audio("src/audio/laser.mp3");

/* Adjust music playback */
introMusic.volume = 0.5;
battleMusic.volume = 0.15;
battleMusic.playbackRate = 1.2;

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
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-a);

  // Main body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(shipSize, 0);
  ctx.lineTo(-shipSize * 0.6, shipSize * 0.4);
  ctx.lineTo(-shipSize * 0.2, 0);
  ctx.lineTo(-shipSize * 0.6, -shipSize * 0.4);
  ctx.closePath();
  ctx.fill();

  // Wings
  ctx.beginPath();
  ctx.moveTo(shipSize * 0.3, -shipSize * 0.1);
  ctx.lineTo(-shipSize * 0.4, -shipSize * 0.6);
  ctx.lineTo(-shipSize * 0.2, -shipSize * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(shipSize * 0.3, shipSize * 0.1);
  ctx.lineTo(-shipSize * 0.4, shipSize * 0.6);
  ctx.lineTo(-shipSize * 0.2, shipSize * 0.3);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.ellipse(
    shipSize * 0.2,
    0,
    shipSize * 0.2,
    shipSize * 0.1,
    0,
    0,
    2 * Math.PI,
  );
  ctx.fill();

  ctx.restore();
};

// *****
// Shoot laser
// *****
function shootLaser() {
  if (ship.canShoot && ship.lasers.length < laserMax) {
    ship.lasers.push({
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (laserSpeed * Math.cos(ship.a)) / framesPerSecond,
      yv: (-laserSpeed * Math.sin(ship.a)) / framesPerSecond,
      dist: 0,
      explodeTime: 0,
    });
    laserSound.play();
  }

  // Prevent further shooting
  ship.canShoot = false;
}

// *****
// Draw laser
// *****
const drawLaser = (elem) => {
  ctx.fillStyle = whiteColor;
  ctx.beginPath();
  ctx.arc(elem.x, elem.y, shipSize / 10, 0, Math.PI * 2, false);
  ctx.fill();
};

// *****
// Draw thruster
// *****
const drawThruster = () => {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(-ship.a);

  const centerX = -shipSize * thrusterCenterOffset;
  const flameWidth = shipSize * thrusterWidth;
  const flameLength = shipSize * thrusterLength;
  const baseWidth = shipSize * thrusterBaseWidth;

  // Main thruster flame
  const gradient = ctx.createRadialGradient(
    centerX,
    0,
    0,
    centerX,
    0,
    flameWidth,
  );
  gradient.addColorStop(0, "rgba(255, 200, 0, 1)");
  gradient.addColorStop(0.6, "rgba(255, 100, 0, 0.8)");
  gradient.addColorStop(1, "rgba(255, 50, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();

  // Start at the narrow base
  ctx.moveTo(centerX, baseWidth / 2);

  // Curve out to the full width
  ctx.quadraticCurveTo(
    centerX - flameLength * 0.2,
    flameWidth * 0.4,
    centerX - flameLength * 0.5,
    flameWidth / 2,
  );

  // Extend out the flame shape
  ctx.quadraticCurveTo(-flameLength, flameWidth / 4, -flameLength, 0);
  ctx.quadraticCurveTo(
    -flameLength,
    -flameWidth / 4,
    centerX - flameLength * 0.5,
    -flameWidth / 2,
  );

  // Mirror the curve back to the narrow base
  ctx.quadraticCurveTo(
    centerX - flameLength * 0.2,
    -flameWidth * 0.4,
    centerX,
    -baseWidth / 2,
  );

  ctx.closePath();
  ctx.fill();

  // Bright core
  const coreSize = shipSize * thrusterCoreSize;
  const coreGradient = ctx.createRadialGradient(
    centerX,
    0,
    0,
    centerX,
    0,
    coreSize,
  );
  coreGradient.addColorStop(0, "rgba(255, 255, 200, 1)");
  coreGradient.addColorStop(1, "rgba(255, 255, 200, 0)");

  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, 0, coreSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

// *****
// Explode ship
// *****
const explodeShip = () => {
  ship.explodeTime = Math.ceil(shipExplodeDuration * framesPerSecond);
  explosionSound.play();
};

// *****
// Draw explosion
// *****
const drawExplosion = (ex, ey, spikes, r) => {
  const explosionProgress =
    1 - ship.explodeTime / (shipExplodeDuration * framesPerSecond);
  const baseRadius = r * (1 + explosionProgress);

  // Outer orange ellipse
  ctx.fillStyle = `rgba(255, 140, 0, ${1 - explosionProgress})`;
  ctx.beginPath();
  ctx.ellipse(ex, ey, baseRadius * 1.5, baseRadius * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner yellow core
  ctx.fillStyle = `rgba(255, 255, 0, ${1 - explosionProgress * 0.7})`;
  ctx.beginPath();
  ctx.ellipse(ex, ey, baseRadius * 0.8, baseRadius * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Optional: Add some variation with spikes
  const spikeLength = baseRadius * 0.3;
  ctx.fillStyle = `rgba(255, 200, 0, ${1 - explosionProgress})`;
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const spikeX =
      ex + Math.cos(angle) * (baseRadius + spikeLength * Math.random());
    const spikeY =
      ey + Math.sin(angle) * (baseRadius + spikeLength * Math.random());

    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(spikeX, spikeY);
    ctx.lineTo(
      ex + Math.cos(angle + 0.2) * baseRadius,
      ey + Math.sin(angle + 0.2) * baseRadius,
    );
    ctx.closePath();
    ctx.fill();
  }
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
  ctx.restore();
};

const moveAsteroid = (i) => {
  roids[i].x += roids[i].xv;
  roids[i].y += roids[i].yv;

  handleScreenEdge(roids[i]);
};

// *****
// Destroy asteroid
// *****
const destroyAsteroid = (index) => {
  let x = roids[index].x;
  let y = roids[index].y;
  let r = roids[index].r;

  console.log(r, Math.ceil(roidsSize / 2));

  // Split the asteroid in 2
  if (r > Math.ceil(roidsSize / 1.125)) {
    roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 1.125)));
    roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 1.125)));
    score += roidsLargePts;
  } else if (r == Math.ceil(roidsSize / 1.125)) {
    roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 2.25)));
    roids.push(newAsteroid(x, y, Math.ceil(roidsSize / 2.25)));
    score += roidsMediumPts;
  } else {
    score += roidsSmallPts;
  }

  // Check high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(saveScore, highScore);
  }

  // Destroy the last fragment of asteroid
  roids.splice(index, 1);
  // hitSound.play();

  // Ratio of remaining asteroids for music tempo
  roidsLeft--;

  // Then new level starts
  if (roids.length === 0) {
    level++;
    newLevel();
  }
};

// *****
// Distance between points
// *****
const distBetweenPoints = (x1, y1, x2, y2) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

// *****
// Handle screen edge
// *****
const handleScreenEdge = (elem) => {
  r = elem.r || 0;

  if (elem.x < 0 - r) {
    elem.x = canvas.width + r;
  } else if (elem.x > canvas.width + r) {
    elem.x = 0 - r;
  }

  if (elem.y < 0 - r) {
    elem.y = canvas.height + r;
  } else if (elem.y > canvas.height + r) {
    elem.y = 0 - r;
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
      battleMusic.currentTime = 0;

      // Play calm intro music
      introMusic.play();
    } else {
      // Stop intro music and reset time
      introMusic.pause();
      introMusic.currentTime = 0;

      // Play battle music
      battleMusic.play();
      battleMusic.play();
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
    case 32: // Spacebar
      if (screen === "intro") {
        newGame();
        break;
      }

      shootLaser();
      break;
    case 37: // Left
    case 65: // A
      ship.rotation = ((shipTurnSpeed / 360) * Math.PI) / framesPerSecond;
      break;
    case 38: // Up
    case 87: // W
      ship.thrusting = true;
      break;
    case 39: // Right
    case 68: // D
      ship.rotation = ((-shipTurnSpeed / 360) * Math.PI) / framesPerSecond;
      break;
    case 77: // M
      musicToggle();
      break;
  }
};

// *****
// Key release handling
// *****
const keyUp = (e) => {
  switch (e.keyCode) {
    case 32: // Space Bar
      ship.canShoot = true;
      break;
    case 37: // Left
    case 65: // A
      ship.rotation = 0;
      break;
    case 38: // Up
    case 87: // W
      ship.thrusting = false;
      break;
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
  ctx.restore();

  if (highScore) {
    // Show high score
    ctx.fillStyle = "#C9C9C9";
    ctx.font = textSize / 1.5 + "px micro5";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("High Score: " + highScore, canvas.width / 2, shipSize * 2);
  }
  music();
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

  if (ship) {
    let exploding = ship.explodeTime > 0;

    /* Draw and move asteroids */
    let x, y, r, a, vert, offs;
    for (let i = 0; i < roids.length; i++) {
      drawAsteroid(i);
      moveAsteroid(i);
    }

    if (!exploding) {
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
    } else {
      drawExplosion(ship.x, ship.y, 50, ship.r);
    }

    // Rotate the ship
    ship.a += ship.rotation;

    // Move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    handleScreenEdge(ship);

    // Check for asteroid collisions
    if (!exploding) {
      if (!ship.dead) {
        for (let i = 0; i < roids.length; i++) {
          if (
            distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
            ship.r + roids[i].r
          ) {
            explodeShip();
            // destroyAsteroid(i);
            break;
          }
        }
      }

      // Rotate the ship
      ship.a += ship.rotation;

      // Move the ship
      ship.x += ship.thrust.x;
      ship.y += ship.thrust.y;
    } else {
      ship.explodeTime--;
      // Reset the ship after an explosion
      if (ship.explodeTime == 0) {
        gameTime = 0;
        textAlpha = 0;
        introScreen();
        ship = null;
      }
    }

    // Draw the lasers
    for (let i = 0; i < ship.lasers.length; i++) {
      if (ship.lasers[i].explodeTime == 0) {
        drawLaser(ship.lasers[i]);
      }
    }

    // Move the lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
      // Checked distance travelled
      if (ship.lasers[i].dist > laserDist * canvas.width) {
        ship.lasers.splice(i, 1);
        continue;
      }

      // Handle the explosion
      if (ship.lasers[i].explodeTime > 0) {
        ship.lasers[i].explodeTime--;

        // Destroy the laser after duration
        if (ship.lasers[i].explodeTime == 0) {
          ship.lasers.splice(i, 1);
          continue;
        }
      } else {
        // Move the laser
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;

        // Calculate the distance travelled
        ship.lasers[i].dist += Math.sqrt(
          Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2),
        );
      }

      handleScreenEdge(ship.lasers[i]);
    }

    // Draw score
    ctx.fillStyle = "#C9C9C9";
    ctx.font = textSize / 2 + "px micro5";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(score, canvas.width / 2, shipSize * 2);

    // Detect laser hits on asteroid
    let ax, ay, ar, lx, ly;
    for (let i = roids.length - 1; i >= 0; i--) {
      // Get asteroid position
      ax = roids[i].x;
      ay = roids[i].y;
      ar = roids[i].r;

      // Iterate lasers
      for (let j = ship.lasers.length - 1; j >= 0; j--) {
        lx = ship.lasers[j].x;
        ly = ship.lasers[j].y;

        // Detect hits
        if (
          ship.lasers[j].explodeTime === 0 &&
          distBetweenPoints(ax, ay, lx, ly) < ar
        ) {
          // Destroy the asteroid and laser
          destroyAsteroid(i);
          ship.lasers[j].explodeTime = Math.ceil(
            laserExplodeDuration * framesPerSecond,
          );
          break;
        }
      }
    }
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
