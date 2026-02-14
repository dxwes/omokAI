const canvas = document.getElementById("boardCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

let stones = [];
let forbiddenPoints = [];
let winStones = [];

const size = 15;
const cell = canvas.width / size;
const margin = cell * 0.5;

let hoverX = null;
let hoverY = null;

const worker = new Worker('omokWorker.js');
const seed = generateRandomSeed();

const aiTimeTable = [0.03, 0.2, 1.0, 3.0, 10.0];

let aiTimeLimit = 1.0;
let aiColor = 1;
let turn = 0;
let rule = 0;

let aiThinking = false;

worker.onmessage = function (e) {
    const { type, data } = e.data;

    if (type === 'READY') {
        console.log("AI 엔진 준비 완료!");
        worker.postMessage({ type: "INITIALIZE", data: { seed: seed } });
    }

    else if (type == "PLACE") {
        aiThinking = false;
        const color = (data.color == 0) ? "black" : "white";
        stones.push({ x: Math.floor(data.pos / 15), y: data.pos % 15, color: color });
        forbiddenPoints = data.forbidden;

        if (data.color == 1 - aiColor) {
            aiThinking = true;
            worker.postMessage({
                type: "AI_MOVE",
                data: {
                    timeLimit: aiTimeTable[settings.difficulty],
                    depth: 0,
                    rule: rule
                }
            });
        }

        turn = 1 - turn;

        draw();
    }
};

function drawCircle(x, y, radius, color) {
    ctx.beginPath();

    const centerX = x * cell + margin;
    const centerY = y * cell + margin;

    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);

    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function drawBoard() {
    ctx.fillStyle = "#d4a373";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#000000";

    for (let i = 0; i < size; i++) {
        let pos = cell * (i + 0.5);

        ctx.beginPath();
        ctx.moveTo(pos, margin);
        ctx.lineTo(pos, canvas.height - margin);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(margin, pos);
        ctx.lineTo(canvas.width - margin, pos);
        ctx.stroke();
    }

    drawCircle(7, 7, cell * 0.075, "#000000");
    drawCircle(3, 3, cell * 0.075, "#000000");
    drawCircle(3, 11, cell * 0.075, "#000000");
    drawCircle(11, 3, cell * 0.075, "#000000");
    drawCircle(11, 11, cell * 0.075, "#000000");
}

function drawForbiddenPoints() {

    for (let i = 0; i < forbiddenPoints.length; i++) {
        const pos = forbiddenPoints[i];
        const x = Math.floor(pos / 15);
        const y = pos % 15;
        drawCircle(x, y, cell * 0.12, "red");
    }
}

function drawStones() {

    if (stones.length == 0) {
        return;
    }

    let lastStone = stones[stones.length - 1];

    stones.forEach(stone => {

        let color = stone.color === "black"
            ? "#000000"
            : "#FFFFFF";

        drawCircle(stone.x, stone.y, cell * 0.4, color);

        if (
            lastStone &&
            lastStone.x === stone.x &&
            lastStone.y === stone.y &&
            winStones.length === 0
        ) {
            drawCircle(stone.x, stone.y, cell * 0.12, "green");
        }
    });
}

function drawHoverStone() {
    if (hoverX === null) return;

    const color = (turn == 0) ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)';

    ctx.beginPath();
    drawCircle(hoverX, hoverY, cell * 0.4, color);
    ctx.fill();
}


function drawWinStones() {
    winStones.forEach(pos => {
        drawCircle(pos.x, pos.y, cell * 0.18, "lime");
    });
}

function draw() {
    drawBoard();
    drawStones();
    drawForbiddenPoints();
    drawHoverStone();
}

function getBoardPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return {
        x: Math.round((x - margin) / cell),
        y: Math.round((y - margin) / cell)
    };
}

function reset() {

    stones = [];

    aiTimeLimit = aiTimeTable[settings.difficulty];
    aiColor = settings.ai;
    rule = settings.rule;
    turn = 0;
    forbiddenPoints = [];
    worker.postMessage({ type: "BOARD_RESET", data: { rule: rule } });

    draw();

    if (aiColor == 0) {
        worker.postMessage({ type: "PLAYER_MOVE", data: { pos: 112 } })
    }

    switchScreen(0);
}

function generateRandomSeed() {
    const array = new BigUint64Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
}

canvas.addEventListener('mousemove', (event) => {
    const pos = getBoardPosition(event);
    hoverX = pos.x;
    hoverY = pos.y;
    draw();
});

canvas.addEventListener('mouseleave', () => {
    hoverX = null;
    hoverY = null;
    draw();
});

canvas.addEventListener('click', (event) => {
    const pos = getBoardPosition(event);
    const i = Module._board_get_position(pos.x, pos.y);

    if(aiThinking == false){
        worker.postMessage({ type: "PLAYER_MOVE", data: { pos: i } });
    }
    
});

draw();