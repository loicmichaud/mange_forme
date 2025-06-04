let canvas = document.getElementById("game"),
    ctx = canvas.getContext("2d"),
    scoreEl = document.getElementById("score"),
    timerEl = document.getElementById("timer"),
    pseudoDisplay = document.getElementById("pseudoDisplay"),
    highscoreDisplay = document.getElementById("highscoreDisplay"),
    leaderboardDisplay = document.getElementById("leaderboardDisplay"),
    leaderboardSelect = document.getElementById("leaderboardSelect"),
    downloadBtn = document.getElementById("downloadBtn"),
    gameOverEl = document.getElementById("gameover"),
    replayButton = document.getElementById("replayButton"),
    bgMusic = document.getElementById("bgmusic"),
    startMenu = document.getElementById("startMenu"),
    startButton = document.getElementById("startButton"),
    soundToggle = document.getElementById("soundToggle"),
    pseudoInput = document.getElementById("pseudoInput"),
    difficultySelect = document.getElementById("difficultySelect");

let score, level, timeLeft, gameRunning, player, shapes, baseTime;
let pseudo = "", mouseX = 0, mouseY = 0;
const shapeTypes = ['circle', 'square', 'triangle'];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function getBaseTime() {
  const d = difficultySelect.value;
  return d === 'easy' ? 45 : d === 'hard' ? 20 : 30;
}

function showLeaderboard(difficulty, highlight = false) {
  const key = `leaderboard_${difficulty}`;
  let board = JSON.parse(localStorage.getItem(key)) || [];
  let html = `<strong>🏆 Classement (${difficulty}) :</strong><br>`;
  board.slice(0, 3).forEach((e, i) => html += `#${i+1} ${e.pseudo} - ${e.score}<br>`);
  if (highlight) {
    const index = board.findIndex(e => e.pseudo === pseudo && e.score === score);
    if (index > 3) {
      const before = board[index - 1], after = board[index + 1];
      html += '<br><em>Autour de vous :</em><br>';
      if (before) html += `#${index} ${before.pseudo} - ${before.score}<br>`;
      html += `#${index + 1} <strong>${pseudo}</strong> - ${score}<br>`;
      if (after) html += `#${index + 2} ${after.pseudo} - ${after.score}<br>`;
    }
  }
  leaderboardDisplay.innerHTML = html;
}

function updateLeaderboard() {
  const diff = difficultySelect.value, key = `leaderboard_${diff}`;
  let board = JSON.parse(localStorage.getItem(key)) || [];
  board.push({ pseudo, score });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(board.slice(0, 50)));
  showLeaderboard(diff, true);
}

function updateHighscore() {
  const best = JSON.parse(localStorage.getItem('bestScore')) || { score: 0, pseudo: '' };
  if (score > best.score) localStorage.setItem('bestScore', JSON.stringify({ score, pseudo }));
  const updated = JSON.parse(localStorage.getItem('bestScore'));
  highscoreDisplay.textContent = `Meilleur score: ${updated.score} (${updated.pseudo})`;
}

function initGame() {
  score = 0;
  level = 1;
  baseTime = getBaseTime();
  timeLeft = baseTime;
  gameRunning = true;
  scoreEl.textContent = `Score: ${score}`;
  timerEl.textContent = `Temps: ${timeLeft}`;
  pseudoDisplay.textContent = `Pseudo: ${pseudo}`;
  gameOverEl.style.display = 'none';
  leaderboardDisplay.innerHTML = "";
  updateHighscore();
  player = { x: canvas.width/2, y: canvas.height/2, size: 20, color: 'red' };
  shapes = [];
  spawnShapes(10);
  mouseX = player.x;
  mouseY = player.y;
  loop();
  startTimer();
}

function spawnShapes(n) {
  for (let i = 0; i < n; i++) {
    let s = 10 + Math.random() * 20;
    shapes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: s,
      color: `hsl(${Math.random()*360},60%,50%)`,
      type: shapeTypes[Math.floor(Math.random()*shapeTypes.length)],
      alpha: 1
    });
  }
}

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function update() {
  if (!gameRunning) return;
  let dx = mouseX - player.x, dy = mouseY - player.y;
  player.x += dx * 0.1;
  player.y += dy * 0.1;
  for (let i = shapes.length - 1; i >= 0; i--) {
    let s = shapes[i];
    if (Math.hypot(player.x - s.x, player.y - s.y) < player.size + s.size) {
      shapes.splice(i, 1);
      score++;
      scoreEl.textContent = `Score: ${score}`;
      if (shapes.length === 0) {
        level++;
        timeLeft += Math.round(baseTime * 0.3);
        spawnShapes(5 + level * 2);
      }
    }
  }
}

function drawShape(s) {
  ctx.save();
  ctx.globalAlpha = s.alpha;
  ctx.fillStyle = s.color;
  ctx.beginPath();
  if (s.type === 'circle') ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
  else if (s.type === 'square') ctx.fillRect(s.x - s.size/2, s.y - s.size/2, s.size, s.size);
  else if (s.type === 'triangle') {
    ctx.moveTo(s.x, s.y - s.size);
    ctx.lineTo(s.x - s.size, s.y + s.size);
    ctx.lineTo(s.x + s.size, s.y + s.size);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  shapes.forEach(drawShape);
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
}

function loop() {
  update();
  draw();
  if (gameRunning) requestAnimationFrame(loop);
}

function startTimer() {
  const timer = setInterval(() => {
    if (!gameRunning) return clearInterval(timer);
    timeLeft--;
    timerEl.textContent = `Temps: ${timeLeft}`;
    if (timeLeft <= 0) {
      gameOver();
      clearInterval(timer);
    }
  }, 1000);
}

function gameOver() {
  gameRunning = false;
  gameOverEl.style.display = 'block';
  updateHighscore();
  updateLeaderboard();
}

startButton.addEventListener('click', () => {
  pseudo = pseudoInput.value.trim() || "Joueur";
  startMenu.style.display = 'none';
  initGame();
});

replayButton.addEventListener('click', () => {
  initGame();
});

leaderboardSelect.addEventListener('change', () => showLeaderboard(leaderboardSelect.value));

downloadBtn.addEventListener('click', () => {
  const difficulty = leaderboardSelect.value;
  const data = JSON.parse(localStorage.getItem(`leaderboard_${difficulty}`)) || [];
  let text = `Classement (${difficulty.toUpperCase()})\n\n`;
  data.forEach((entry, index) => {
    text += `#${index + 1} ${entry.pseudo} - ${entry.score}\n`;
  });
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `classement_${difficulty}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
