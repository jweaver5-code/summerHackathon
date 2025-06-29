const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const welcomeScreen = document.getElementById('welcomeScreen');
const characterGrid = document.getElementById('characterGrid');

// Characters array with bird and pipe images
const characters = [
  { name: "Jack Sparrow", birdImg: "images/sparrow.png", pipeImg: "images/sparrow_pipe.png" },
  { name: "Jack Dawson", birdImg: "images/titanic.png", pipeImg: "images/titanic_pipe.png" },
  { name: "Jack Jack", birdImg: "images/jackjack.png", pipeImg: "images/jackjack_pipe.png" },
  { name: "Jack Black", birdImg: "images/black.png", pipeImg: "images/black_pipe.png" },
  { name: "Jack Torrance", birdImg: "images/shining.png", pipeImg: "images/shining_pipe.png" },
  { name: "Jack Skellington", birdImg: "images/skellington.png", pipeImg: "images/skellington_pipe.png" },
  { name: "Beanstalk Jack", birdImg: "images/jackBean.png", pipeImg: "images/jackBean_pipe.png" },
  { name: "Jack Johnson", birdImg: "images/bananaJack.png", pipeImg: "images/bananaJack_pipe.png" },
  { name: "Jack Daniels", birdImg: "images/daniels.png", pipeImg: "images/daniels_pipe.png" },
  { name: "Jack My Brother", birdImg: "images/weaver.png", pipeImg: "images/pipeNorth.png" }
];

// Store selected images separately
let selectedBirdImageSrc = null;
let selectedPipeImageSrc = null;
let birdImgObj = new Image();
let pipeImgObj = new Image();

// Animation frame handle
let animationFrameId = null;

function populateCharacterGrid() {
  characterGrid.innerHTML = ''; // Clear grid before populating
  characters.forEach((char) => {
    const option = document.createElement('div');
    option.classList.add('characterOption');
    option.innerHTML = `
      <img src="${char.birdImg}" alt="${char.name}" />
      <span>${char.name}</span>
    `;
    option.addEventListener('click', () => startGameWithCharacterSelection(char));
    characterGrid.appendChild(option);
  });
}

populateCharacterGrid();

function startGameWithCharacterSelection(character) {
  // Cancel any old loop before starting new
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  selectedBirdImageSrc = character.birdImg;
  selectedPipeImageSrc = character.pipeImg;
  birdImgObj.src = selectedBirdImageSrc;
  pipeImgObj.src = selectedPipeImageSrc;
  welcomeScreen.style.display = 'none';
  resizeCanvas();
  restartGame();
  update();
}

// Resize
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// Game variables
let birdX = 100;
let birdY = canvas.height / 2;
let velocity = 0;
const gravity = 0.5;
const flapStrength = -10;
const birdRadius = 50;

let pipes = [];
const pipeWidth = 300;
const pipeGap = 350;
const pipeSpeed = 5

let score = 0;
let highScore = localStorage.getItem('flappyHighScore') 
  ? parseInt(localStorage.getItem('flappyHighScore')) 
  : 0;

let gameOver = false;

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameOver) {
      restartGame();
    } else if (selectedBirdImageSrc) {
      velocity = flapStrength;
    }
  }
  if (e.code === 'Enter' && gameOver) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    // Fully reset game state but keep high score
    birdX = canvas.width * 0.25;
    birdY = canvas.height / 2;
    velocity = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameOver = false;
    welcomeScreen.style.display = 'flex';
  }
});

function spawnPipe() {
  const minGapTop = 100;
  const maxGapTop = canvas.height - pipeGap - 100;
  const topHeight = Math.random() * (maxGapTop - minGapTop) + minGapTop;
  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + pipeGap,
    passed: false
  });
}

function drawBird() {
  if (birdImgObj.complete && selectedBirdImageSrc) {
    ctx.drawImage(birdImgObj, birdX - birdRadius, birdY - birdRadius, birdRadius * 2, birdRadius * 2);
  } else {
    ctx.beginPath();
    ctx.arc(birdX, birdY, birdRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.stroke();
  }
}

function drawPipes() {
  for (const pipe of pipes) {
    if (pipeImgObj.complete && selectedPipeImageSrc) {
      // Draw top pipe (normal)
      ctx.drawImage(pipeImgObj, pipe.x, pipe.top - 500, pipeWidth, 500);

      // Draw bottom pipe (flipped vertically)
      ctx.save();
      ctx.translate(pipe.x + pipeWidth / 2, pipe.bottom + 250);
      ctx.scale(1, -1);
      ctx.drawImage(pipeImgObj, -pipeWidth / 2, -250, pipeWidth, 500);
      ctx.restore();
    } else {
      ctx.fillStyle = 'green';
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
      ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
    }
  }
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText(`Score: ${score}`, 20, 40);
  ctx.fillText(`High Score: ${highScore}`, 20, 80);
}

function drawGameOver() {
  ctx.fillStyle = 'red';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
  ctx.font = '30px Arial';
  ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2);
  ctx.fillText('Press ENTER to choose new character', canvas.width / 2, canvas.height / 2 + 40);
  ctx.textAlign = 'start';
}

function checkCollision() {
  if (birdY - birdRadius < 0 || birdY + birdRadius > canvas.height) {
    return true;
  }

  for (const pipe of pipes) {
    if (
      birdX + birdRadius > pipe.x &&
      birdX - birdRadius < pipe.x + pipeWidth &&
      (birdY - birdRadius < pipe.top || birdY + birdRadius > pipe.bottom)
    ) {
      return true;
    }
  }

  return false;
}

let frameCount = 0;

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    velocity += gravity;
    birdY += velocity;

    frameCount++;
    if (frameCount >= 60 && frameCount % 120 === 0) {
      spawnPipe();
    }

    for (const pipe of pipes) {
      pipe.x -= pipeSpeed;
    }

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    for (const pipe of pipes) {
      if (!pipe.passed && pipe.x + pipeWidth < birdX) {
        score++;
        pipe.passed = true;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('flappyHighScore', highScore);
        }
      }
    }

    if (checkCollision()) {
      gameOver = true;
    }
  }

  drawPipes();
  drawBird();
  drawScore();

  if (gameOver) {
    drawGameOver();
  }

  animationFrameId = requestAnimationFrame(update);
}

function restartGame() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  birdX = canvas.width * 0.25;
  birdY = canvas.height / 2;
  velocity = 0;
  pipes = [];
  score = 0;
  frameCount = 0;
  gameOver = false;
  update();
}
