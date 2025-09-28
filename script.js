// Game state management
class GameState {
    constructor() {
        this.board = Array(9).fill(null); // Track actual game state
        this.currentPlayer = "X";
        this.scores = { X: 0, O: 0, draws: 0 };
        this.gameOver = false;
        this.fadeTime = 5000;
        this.removeTime = 7000;
        this.cellTimers = Array(9).fill(null); // Track timers for each cell
        this.moveCount = 0;
        this.maxMovesWithoutWin = 20; // Draw condition
        this.roundTimeLeft = 60; // 1 minute per round
        this.roundTimer = null;
    }

    reset() {
        this.board = Array(9).fill(null);
        this.currentPlayer = "X";
        this.gameOver = false;
        this.moveCount = 0;
        this.roundTimeLeft = 60;
        
        // Clear all existing timers
        this.cellTimers.forEach(timer => {
            if (timer) {
                clearTimeout(timer.fadeTimer);
                clearTimeout(timer.removeTimer);
            }
        });
        this.cellTimers = Array(9).fill(null);
        
        // Clear round timer
        if (this.roundTimer) {
            clearInterval(this.roundTimer);
        }
        this.startRoundTimer();
    }

    makeMove(index) {
        if (this.board[index] !== null || this.gameOver) return false;

        this.board[index] = this.currentPlayer;
        this.moveCount++;

        // Set up disappearing timers
        const fadeTimer = setTimeout(() => {
            const cell = cells[index];
            const mark = cell.querySelector('.mark');
            if (mark) mark.classList.add('fading');
            this.updateTimerBar(index, true);
        }, this.fadeTime);

        const removeTimer = setTimeout(() => {
            this.board[index] = null;
            this.cellTimers[index] = null;
            this.renderCell(index);
            this.checkGameState();
        }, this.removeTime);

        this.cellTimers[index] = { fadeTimer, removeTimer };
        this.updateTimerBar(index, false);
        return true;
    }

    updateTimerBar(index, isFading) {
        const cell = cells[index];
        const existingBar = cell.querySelector('.timer-bar');
        if (existingBar) existingBar.remove();

        const timerBar = document.createElement('div');
        timerBar.className = 'timer-bar';

        if (!isFading) {
            // Full width initially, then fade to 0
            timerBar.style.width = '100%';
            timerBar.style.transitionDuration = `${this.fadeTime}ms`;
            setTimeout(() => {
                timerBar.style.width = '0%';
            }, 10);
        } else {
            // Change color during fade phase
            timerBar.style.background = 'linear-gradient(90deg, #ff4444, #ff0000)';
            timerBar.style.width = '100%';
            timerBar.style.transitionDuration = `${this.removeTime - this.fadeTime}ms`;
            setTimeout(() => {
                timerBar.style.width = '0%';
            }, 10);
        }

        cell.appendChild(timerBar);
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] &&
                this.board[a] === this.board[b] &&
                this.board[b] === this.board[c]) {
                this.gameOver = true;
                this.highlightWinningCells(pattern);
                this.scores[this.board[a]]++;
                
                // Stop round timer when someone wins
                if (this.roundTimer) {
                    clearInterval(this.roundTimer);
                }
                return this.board[a];
            }
        }
        return null;
    }

    checkDraw() {
        // Check if game has gone too long without a winner
        if (this.moveCount >= this.maxMovesWithoutWin) {
            this.gameOver = true;
            this.scores.draws++;
            return true;
        }
        return false;
    }

    checkGameState() {
        const winner = this.checkWin();
        if (winner) {
            updateScoreboard();
            showWinner(winner);
            return;
        }

        if (this.checkDraw()) {
            updateScoreboard();
            showDraw();
            return;
        }
    }

    highlightWinningCells(pattern) {
        pattern.forEach(index => {
            cells[index].classList.add('win');
        });
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
        updateCurrentPlayerDisplay();
    }

    setMode(mode) {
        switch (mode) {
            case 'normal':
                this.fadeTime = 5000;
                this.removeTime = 7000;
                this.maxMovesWithoutWin = 20;
                break;
            case 'rapid':
                this.fadeTime = 3000;
                this.removeTime = 4500;
                this.maxMovesWithoutWin = 15;
                break;
            case 'blitz':
                this.fadeTime = 2000;
                this.removeTime = 3000;
                this.maxMovesWithoutWin = 12;
                break;
        }
    }

    renderCell(index) {
        const cell = cells[index];
        cell.innerHTML = '';
        cell.classList.remove('occupied', 'win');

        if (this.board[index]) {
            const mark = document.createElement('span');
            mark.textContent = this.board[index];
            mark.className = `mark ${this.board[index].toLowerCase()}`;
            cell.appendChild(mark);
            cell.classList.add('occupied');
        }
    }

    renderBoard() {
        for (let i = 0; i < 9; i++) {
            this.renderCell(i);
        }
    }

    startRoundTimer() {
        updateRoundTimer();
        this.roundTimer = setInterval(() => {
            this.roundTimeLeft--;
            updateRoundTimer();

            if (this.roundTimeLeft <= 0) {
                this.endRound();
            }
        }, 1000);
    }

    endRound() {
        if (this.roundTimer) {
            clearInterval(this.roundTimer);
        }
        this.scores.draws++;
        updateScoreboard();
        showTimeUp();
        setTimeout(() => {
            this.reset();
            this.renderBoard();
            updateCurrentPlayerDisplay();
            document.getElementById("winModal").style.display = "none";
        }, 2000);
    }
}

// Initialize game
const gameState = new GameState();
const board = document.getElementById("board");
const scoreboard = document.getElementById("scoreboard");
const modeSelect = document.getElementById("mode");
const currentPlayerDisplay = document.getElementById("currentPlayerDisplay");
const roundTimerDisplay = document.getElementById("roundTimer");
const cells = [];

// Create board cells
function initializeBoard() {
    board.innerHTML = '';
    cells.length = 0;

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        cell.addEventListener("click", () => handleCellClick(i));
        board.appendChild(cell);
        cells.push(cell);
    }
}

// Handle cell click
function handleCellClick(index) {
    if (gameState.makeMove(index)) {
        gameState.renderCell(index);

        const winner = gameState.checkWin();
        if (winner) {
            updateScoreboard();
            showWinner(winner);
            return;
        }

        if (gameState.checkDraw()) {
            updateScoreboard();
            showDraw();
            return;
        }

        gameState.switchPlayer();
    }
}

// Update UI functions
function updateCurrentPlayerDisplay() {
    const playerClass = gameState.currentPlayer === 'X' ? 'x' : 'o';
    currentPlayerDisplay.innerHTML = `<span class="mark ${playerClass}">Player ${gameState.currentPlayer}'s Turn</span>`;
}

function updateScoreboard() {
    scoreboard.textContent = `X: ${gameState.scores.X} | O: ${gameState.scores.O} | Draws: ${gameState.scores.draws}`;
}

function updateRoundTimer() {
    const minutes = Math.floor(gameState.roundTimeLeft / 60);
    const seconds = gameState.roundTimeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    roundTimerDisplay.textContent = timeString;

    // Add warning style when time is low
    if (gameState.roundTimeLeft <= 10) {
        roundTimerDisplay.classList.add('warning');
    } else {
        roundTimerDisplay.classList.remove('warning');
    }
}

function showTimeUp() {
    const modal = document.getElementById("winModal");
    const message = document.getElementById("winMessage");
    const subtext = document.getElementById("winSubtext");

    message.textContent = "⏰ Time's Up!";
    subtext.textContent = "Round ended. Starting new round...";
    modal.style.display = "flex";
}

function showWinner(player) {
    const modal = document.getElementById("winModal");
    const message = document.getElementById("winMessage");
    const subtext = document.getElementById("winSubtext");

    message.innerHTML = `🎉 Player <span class="mark ${player.toLowerCase()}">${player}</span> Wins!`;
    subtext.textContent = `Great job! Starting new round...`;
    modal.style.display = "flex";

    // Auto restart after 3 seconds
    setTimeout(() => {
        resetGame();
    }, 3000);
}

function showDraw() {
    const modal = document.getElementById("winModal");
    const message = document.getElementById("winMessage");
    const subtext = document.getElementById("winSubtext");

    message.textContent = "🤝 It's a Draw!";
    subtext.textContent = `Starting new round...`;
    modal.style.display = "flex";

    // Auto restart after 3 seconds
    setTimeout(() => {
        resetGame();
    }, 3000);
}

// Game control functions
function resetGame() {
    gameState.reset();
    gameState.renderBoard();
    updateCurrentPlayerDisplay();
    document.getElementById("winModal").style.display = "none";
    cells.forEach(cell => {
        cell.classList.remove('win');
        const timerBar = cell.querySelector('.timer-bar');
        if (timerBar) timerBar.remove();
    });
}

function setMode() {
    const mode = modeSelect.value;
    gameState.setMode(mode);
    resetGame();
}

function toggleAbout() {
    const modal = document.getElementById("aboutModal");
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
    // Prevent shortcuts when modal is open (except Escape)
    const modalOpen = document.getElementById("aboutModal").style.display === "flex" ||
        document.getElementById("winModal").style.display === "flex";

    if (e.key === "Escape") {
        document.getElementById("aboutModal").style.display = "none";
        document.getElementById("winModal").style.display = "none";
        return;
    }

    if (modalOpen) return;

    switch (e.key.toLowerCase()) {
        case 'm':
            e.preventDefault();
            const currentIndex = modeSelect.selectedIndex;
            modeSelect.selectedIndex = (currentIndex + 1) % modeSelect.options.length;
            setMode();
            break;
        case 'h':
            e.preventDefault();
            toggleAbout();
            break;
    }
});

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Initialize the game
initializeBoard();
updateCurrentPlayerDisplay();
updateScoreboard();
gameState.startRoundTimer();

// Add some visual polish
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth transitions to all interactive elements
    const style = document.createElement('style');
    style.textContent = `
        .cell, .btn, select {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mark {
            animation: markAppear 0.3s ease;
        }
        @keyframes markAppear {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});