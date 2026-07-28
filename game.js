"use strict";

/*
    BONG! Version 1.0
    Ett färgglatt singleplayerspel.
*/

// Hämtar spelets delar från HTML-filen.
const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highscoreElement = document.getElementById("highscore");

const startMenu = document.getElementById("startMenu");
const gameOverMenu = document.getElementById("gameOverMenu");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const menuButton = document.getElementById("menuButton");

const finalScoreElement = document.getElementById("finalScore");
const newHighscoreMessage = document.getElementById(
    "newHighscoreMessage"
);

// Spelets status.
let gameRunning = false;
let animationId = null;

let score = 0;

// Hämtar tidigare highscore från webbläsaren.
let highscore = Number(
    localStorage.getItem("bongHighscore")
) || 0;

highscoreElement.textContent = highscore;

// Tangentbordskontroller.
const keys = {
    left: false,
    right: false
};

// Spelarens platta.
const paddle = {
    width: 150,
    height: 20,
    x: canvas.width / 2 - 75,
    y: canvas.height - 45,
    speed: 9
};

// Bollen.
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    speedX: 4,
    speedY: -4
};

// Färger som bollen kan få.
const ballColors = [
    "#ffdf3d",
    "#ff59b7",
    "#55e8ff",
    "#79ff72",
    "#ff8547",
    "#ffffff"
];

let ballColor = ballColors[0];

// Små färgpartiklar vid studs.
const particles = [];

/**
 * Återställer plattan och bollen.
 */
function resetGameObjects() {
    paddle.x = canvas.width / 2 - paddle.width / 2;

    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;

    const horizontalDirection = Math.random() > 0.5 ? 1 : -1;

    ball.speedX = 4 * horizontalDirection;
    ball.speedY = -4;

    ballColor = ballColors[0];

    particles.length = 0;
}

/**
 * Startar ett nytt spel.
 */
function startGame() {
    cancelAnimationFrame(animationId);

    score = 0;
    scoreElement.textContent = score;

    newHighscoreMessage.classList.add("hidden");

    resetGameObjects();

    startMenu.classList.add("hidden");
    gameOverMenu.classList.add("hidden");

    gameRunning = true;

    gameLoop();
}

/**
 * Visar startmenyn.
 */
function showStartMenu() {
    cancelAnimationFrame(animationId);

    gameRunning = false;

    gameOverMenu.classList.add("hidden");
    startMenu.classList.remove("hidden");

    score = 0;
    scoreElement.textContent = score;

    resetGameObjects();
    drawGame();
}

/**
 * Avslutar spelet.
 */
function endGame() {
    gameRunning = false;

    finalScoreElement.textContent = score;

    if (score > highscore) {
        highscore = score;

        highscoreElement.textContent = highscore;

        localStorage.setItem(
            "bongHighscore",
            highscore.toString()
        );

        newHighscoreMessage.classList.remove("hidden");
    } else {
        newHighscoreMessage.classList.add("hidden");
    }

    gameOverMenu.classList.remove("hidden");
}

/**
 * Uppdaterar plattans position.
 */
function updatePaddle() {
    if (keys.left) {
        paddle.x -= paddle.speed;
    }

    if (keys.right) {
        paddle.x += paddle.speed;
    }

    // Stoppar plattan vid spelplanens kanter.
    if (paddle.x < 0) {
        paddle.x = 0;
    }

    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

/**
 * Uppdaterar bollen.
 */
function updateBall() {
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Studs mot vänster vägg.
    if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.speedX *= -1;

        createParticles(ball.x, ball.y);
        changeBallColor();
    }

    // Studs mot höger vägg.
    if (ball.x + ball.radius >= canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.speedX *= -1;

        createParticles(ball.x, ball.y);
        changeBallColor();
    }

    // Studs mot taket.
    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.speedY *= -1;

        createParticles(ball.x, ball.y);
        changeBallColor();
    }

    const ballBottom = ball.y + ball.radius;

    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;

    const ballIsInsidePaddleWidth =
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width;

    const ballTouchesPaddle =
        ballBottom >= paddleTop &&
        ballBottom <= paddleBottom + Math.abs(ball.speedY);

    // Studs mot spelarens platta.
    if (
        ball.speedY > 0 &&
        ballTouchesPaddle &&
        ballIsInsidePaddleWidth
    ) {
        ball.y = paddle.y - ball.radius;
        ball.speedY *= -1;

        /*
            Bollens riktning påverkas av var på plattan
            den träffar.
        */
        const paddleCenter =
            paddle.x + paddle.width / 2;

        const hitPosition =
            (ball.x - paddleCenter) /
            (paddle.width / 2);

        ball.speedX += hitPosition * 2;

        score += 1;
        scoreElement.textContent = score;

        /*
            Spelet blir långsamt snabbare,
            men inte för snabbt.
        */
        const maximumSpeed = 10;

        ball.speedX = limitSpeed(
            ball.speedX * 1.025,
            maximumSpeed
        );

        ball.speedY = limitSpeed(
            ball.speedY * 1.025,
            maximumSpeed
        );

        createParticles(ball.x, ball.y);
        changeBallColor();
    }

    // Bollen har passerat plattan.
    if (ball.y - ball.radius > canvas.height) {
        endGame();
    }
}

/**
 * Begränsar bollens hastighet.
 */
function limitSpeed(speed, maximumSpeed) {
    if (speed > maximumSpeed) {
        return maximumSpeed;
    }

    if (speed < -maximumSpeed) {
        return -maximumSpeed;
    }

    return speed;
}

/**
 * Väljer en ny färg på bollen.
 */
function changeBallColor() {
    const randomIndex = Math.floor(
        Math.random() * ballColors.length
    );

    ballColor = ballColors[randomIndex];
}

/**
 * Skapar färgpartiklar.
 */
function createParticles(x, y) {
    for (let index = 0; index < 12; index += 1) {
        particles.push({
            x,
            y,
            radius: Math.random() * 4 + 2,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 6 - 3,
            life: 28,
            color: ballColor
        });
    }
}

/**
 * Uppdaterar partiklarna.
 */
function updateParticles() {
    for (
        let index = particles.length - 1;
        index >= 0;
        index -= 1
    ) {
        const particle = particles[index];

        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life -= 1;
        particle.radius *= 0.96;

        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    }
}

/**
 * Ritar spelplanens dekorationer.
 */
function drawBackgroundDetails() {
    context.save();

    context.globalAlpha = 0.17;
    context.fillStyle = "#ffffff";

    for (let y = 35; y < canvas.height; y += 70) {
        for (let x = 35; x < canvas.width; x += 70) {
            context.beginPath();
            context.arc(x, y, 4, 0, Math.PI * 2);
            context.fill();
        }
    }

    context.restore();
}

/**
 * Ritar plattan.
 */
function drawPaddle() {
    const gradient = context.createLinearGradient(
        paddle.x,
        paddle.y,
        paddle.x + paddle.width,
        paddle.y
    );

    gradient.addColorStop(0, "#55e8ff");
    gradient.addColorStop(0.5, "#79ff72");
    gradient.addColorStop(1, "#ffdf3d");

    context.save();

    context.shadowColor = "rgba(85, 232, 255, 0.8)";
    context.shadowBlur = 18;

    context.fillStyle = gradient;

    roundedRectangle(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height,
        10
    );

    context.fill();

    context.restore();
}

/**
 * Ritar bollen.
 */
function drawBall() {
    context.save();

    context.shadowColor = ballColor;
    context.shadowBlur = 24;

    context.fillStyle = ballColor;

    context.beginPath();
    context.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );
    context.fill();

    // Liten ljuspunkt på bollen.
    context.fillStyle = "rgba(255, 255, 255, 0.75)";

    context.beginPath();
    context.arc(
        ball.x - 5,
        ball.y - 5,
        4,
        0,
        Math.PI * 2
    );
    context.fill();

    context.restore();
}

/**
 * Ritar partiklarna.
 */
function drawParticles() {
    for (const particle of particles) {
        context.save();

        context.globalAlpha =
            Math.max(particle.life / 28, 0);

        context.fillStyle = particle.color;

        context.beginPath();
        context.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );
        context.fill();

        context.restore();
    }
}

/**
 * Hjälpfunktion för rundade rektanglar.
 */
function roundedRectangle(x, y, width, height, radius) {
    context.beginPath();

    context.roundRect(
        x,
        y,
        width,
        height,
        radius
    );
}

/**
 * Ritar hela spelet.
 */
function drawGame() {
    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawBackgroundDetails();
    drawParticles();
    drawPaddle();
    drawBall();
}

/**
 * Spelets huvudloop.
 */
function gameLoop() {
    if (!gameRunning) {
        drawGame();
        return;
    }

    updatePaddle();
    updateBall();
    updateParticles();

    drawGame();

    animationId = requestAnimationFrame(gameLoop);
}

/**
 * Flyttar plattan med mus eller styrplatta.
 */
function movePaddleWithPointer(event) {
    if (!gameRunning) {
        return;
    }

    const canvasRectangle =
        canvas.getBoundingClientRect();

    /*
        Räknar om skärmens position till canvasens
        interna storlek.
    */
    const scaleX =
        canvas.width / canvasRectangle.width;

    const pointerX =
        (event.clientX - canvasRectangle.left) * scaleX;

    paddle.x = pointerX - paddle.width / 2;

    if (paddle.x < 0) {
        paddle.x = 0;
    }

    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

/**
 * Flyttar plattan med fingret.
 */
function movePaddleWithTouch(event) {
    if (!gameRunning) {
        return;
    }

    event.preventDefault();

    const touch = event.touches[0];

    if (!touch) {
        return;
    }

    const canvasRectangle =
        canvas.getBoundingClientRect();

    const scaleX =
        canvas.width / canvasRectangle.width;

    const touchX =
        (touch.clientX - canvasRectangle.left) * scaleX;

    paddle.x = touchX - paddle.width / 2;

    if (paddle.x < 0) {
        paddle.x = 0;
    }

    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// Tangentbord: knapp trycks ner.
document.addEventListener("keydown", (event) => {
    if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
    ) {
        keys.left = true;
        event.preventDefault();
    }

    if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
    ) {
        keys.right = true;
        event.preventDefault();
    }

    if (
        event.code === "Space" &&
        !gameRunning
    ) {
        startGame();
        event.preventDefault();
    }
});

// Tangentbord: knapp släpps.
document.addEventListener("keyup", (event) => {
    if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
    ) {
        keys.left = false;
    }

    if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
    ) {
        keys.right = false;
    }
});

// Mus och styrplatta.
canvas.addEventListener(
    "mousemove",
    movePaddleWithPointer
);

// Pekskärm.
canvas.addEventListener(
    "touchmove",
    movePaddleWithTouch,
    {
        passive: false
    }
);

// Menyknappar.
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
menuButton.addEventListener("click", showStartMenu);

// Ritar spelet bakom startmenyn när sidan öppnas.
resetGameObjects();
drawGame()