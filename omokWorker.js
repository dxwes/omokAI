importScripts("omok2.js");

let moduleReady = false;
const winning_score = 30000;
const losing_score = -30000;
const eval_max = winning_score - 1000;
const eval_min = losing_score + 1000;


Module.onRuntimeInitialized = () => {
    postMessage({ type: 'READY' });

    moduleReady = true;
};

function getForbidden() {
    let points = []
    for (let i = 0; i < 225; i++) {
        if (Module._board_get_color(i) == -1 && Module._board_forbidden_point(i)) {
            points.push(i);
        }
    }
    console.log(points);
    return points;
}

onmessage = function (e) {

    if (moduleReady === false) {
        console.log("I'm not ready");
        return;
    }

    const { type, data } = e.data;

    if (type === "AI_MOVE") {
        console.log("start");
        const aiPos = Module._omok_ai_move(data.timeLimit, data.depth);
        if (Module._board_move(aiPos)) {
            postMessage({
                type: 'PLACE',
                data: {
                    pos: aiPos,
                    color: 1 - Module._board_turn(),
                    forbidden: getForbidden()
                }
            });

            console.log("search node count : ", Module._sei_search_node_count());
            let score = Module._sei_score();

            if (score > eval_max) {
                console.log("win to M-", winning_score - score);
            }
            else if (score < eval_min) {
                console.log("lose to M-", score - losing_score);
            }
            else {
                console.log("score is ", score);
            }

            let minDepth = Module._sei_min_depth();
            let maxDepth = Module._sei_max_depth();

            if (minDepth > maxDepth) {
                maxDepth = minDepth;
            }
            console.log("depth ", minDepth, "-", maxDepth);
        }
    }

    else if (type == "PLAYER_MOVE") {
        if (Module._board_move(data.pos)) {
            postMessage({
                type: 'PLACE',
                data: {
                    pos: data.pos,
                    color: 1 - Module._board_turn(),
                    forbidden: getForbidden()
                }
            });
        }
    }

    else if (type == "BOARD_RESET") {
        Module._board_reset(data.rule);
    }

    else if (type == "INITIALIZE") {
        Module._initialize(data.seed);
        Module._board_reset(0);
    }
};