const GAME_DATA = {
    grammar: [
        {
            q: "She ___ to school every day.",
            options: ["go", "goes", "going", "gone"],
            answer: 1
        },
        {
            q: "If I ___ more time, I would learn Spanish.",
            options: ["have", "had", "will have", "having"],
            answer: 1
        },
        {
            q: "The report ___ yesterday.",
            options: ["completed", "was completed", "completes", "has complete"],
            answer: 1
        }
    ],

    vocabulary: [
        {
            q: "What does 'substantial' mean?",
            options: ["very small", "considerable", "temporary", "unclear"],
            answer: 1
        },
        {
            q: "What does 'mitigate' mean?",
            options: ["reduce the severity", "increase", "ignore", "create"],
            answer: 0
        },
        {
            q: "What does 'plausible' mean?",
            options: ["impossible", "believable", "ancient", "dangerous"],
            answer: 1
        }
    ],

    reading: [
        {
            q: "Which statement is supported by the passage?",
            options: [
                "The research was abandoned.",
                "The researchers found evidence.",
                "The project had no results.",
                "The method was never tested."
            ],
            answer: 1
        }
    ],

    ielts: [
        {
            q: "Which is the most academic sentence?",
            options: [
                "People use phones a lot.",
                "Phones are super useful nowadays.",
                "Mobile technology has become increasingly influential in modern society.",
                "Everyone is crazy about phones."
            ],
            answer: 2
        }
    ]
};

let gameState = {
    currentGame: null,
    questions: [],
    index: 0,
    score: 0,
    xp: 0,
    reputation: 0
};

function startGame(type) {
    const questions = GAME_DATA[type];

    if (!questions || !questions.length) {
        alert("Bu game uchun savollar hali mavjud emas.");
        return;
    }

    gameState.currentGame = type;
    gameState.questions = [...questions];
    gameState.index = 0;
    gameState.score = 0;
    gameState.xp = 0;
    gameState.reputation = 0;

    renderGame();
}

function renderGame() {
    const screen = document.getElementById("screen");
    const question = gameState.questions[gameState.index];

    screen.classList.remove("hidden");

    screen.innerHTML = `
        <div class="game-panel" style="padding: 15px; text-align: center;">
            <h2>?? ${gameState.currentGame.toUpperCase()}</h2>

            <div class="game-progress" style="margin: 10px 0; font-weight: bold;">
                ${gameState.index + 1}/${gameState.questions.length}
            </div>

            <h3 style="margin-bottom: 20px;">${question.q}</h3>

            <div class="answers" style="display: flex; flex-direction: column; gap: 10px;">
                ${question.options.map((option, i) => `
                    <button class="answer-btn primary" data-answer="${i}" style="padding: 12px; cursor: pointer;">
                        ${option}
                    </button>
                `).join("")}
            </div>

            <div id="gameResult" style="margin-top: 15px; font-weight: bold;"></div>
        </div>
    `;

    document.querySelectorAll(".answer-btn").forEach(button => {
        button.addEventListener("click", () => {
            checkAnswer(Number(button.dataset.answer));
        });
    });
}

function checkAnswer(selected) {
    const question = gameState.questions[gameState.index];
    const buttons = document.querySelectorAll(".answer-btn");

    buttons.forEach(btn => btn.disabled = true);

    const result = document.getElementById("gameResult");

    if (selected === question.answer) {
        gameState.score++;
        gameState.xp += 25;
        gameState.reputation += 5;

        result.innerHTML = `<div style="color: green;">? Correct! +25 XP · +5 Reputation</div>`;
    } else {
        result.innerHTML = `<div style="color: red;">? Incorrect</div>`;
    }

    setTimeout(() => {
        gameState.index++;

        if (gameState.index >= gameState.questions.length) {
            finishGame();
        } else {
            renderGame();
        }
    }, 800);
}

function finishGame() {
    const screen = document.getElementById("screen");

    screen.innerHTML = `
        <div class="game-panel" style="padding: 20px; text-align: center;">
            <h2>?? Challenge Complete</h2>
            <p>Score: ${gameState.score}/${gameState.questions.length}</p>
            <p>? +${gameState.xp} XP</p>
            <p>?? +${gameState.reputation} Reputation</p>

            <button class="primary" id="backGames" style="padding: 12px 20px; margin-top: 15px;">
                ?? PLAY AGAIN
            </button>
        </div>
    `;

    document.getElementById("backGames").addEventListener("click", () => {
        showGames();
    });
}

function showGames() {
    const screen = document.getElementById("screen");

    screen.classList.remove("hidden");

    screen.innerHTML = `
        <div class="game-panel" style="display: flex; flex-direction: column; gap: 10px; padding: 15px;">
            <h2>?? GAMES</h2>

            <button class="primary game-choice" data-game="reading" style="padding: 12px;">?? Memory Raid</button>
            <button class="primary game-choice" data-game="grammar" style="padding: 12px;">?? Grammar Trap</button>
            <button class="primary game-choice" data-game="vocabulary" style="padding: 12px;">?? Word Hunter</button>
            <button class="primary game-choice" data-game="ielts" style="padding: 12px;">?? IELTS Boss Fight</button>
        </div>
    `;

    document.querySelectorAll(".game-choice").forEach(button => {
        button.addEventListener("click", () => {
            startGame(button.dataset.game);
        });
    });
}

// O'yin tugmasi bosilganda ko'rsatish
document.addEventListener("DOMContentLoaded", () => {
    const gamesBtn = document.getElementById("gamesBtn");
    if (gamesBtn) {
        gamesBtn.addEventListener("click", showGames);
    }
});