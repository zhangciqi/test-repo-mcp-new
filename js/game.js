/**
 * 2048 游戏核心逻辑
 * 实现P0（核心功能）、P1（动画效果）、P2（本地存储）功能
 */

class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.isAnimating = false;
        this.hasWon = false;
        this.continueAfterWin = false;

        this.tileContainer = document.getElementById('tile-container');
        this.gridBackground = document.getElementById('grid-background');
        this.currentScoreEl = document.getElementById('current-score');
        this.bestScoreEl = document.getElementById('best-score');
        this.winOverlay = document.getElementById('win-overlay');
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.finalScoreEl = document.getElementById('final-score');
        this.instructionsEl = document.getElementById('instructions');

        this.init();
        this.setupEventListeners();
    }

    init() {
        this.grid = Array(4).fill(null).map(() => Array(4).fill(0));
        this.score = 0;
        this.hasWon = false;
        this.continueAfterWin = false;
        this.lastNewTile = null;
        this.lastMergedPositions = null;

        this.createBackgroundGrid();
        this.updateScoreDisplay();
        this.winOverlay.classList.remove('active');
        this.gameoverOverlay.classList.remove('active');

        this.addRandomTile();
        this.addRandomTile();
    }

    createBackgroundGrid() {
        this.gridBackground.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            this.gridBackground.appendChild(cell);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.setupTouchControls();

        document.getElementById('new-game-btn').addEventListener('click', () => this.init());
        document.getElementById('retry-btn').addEventListener('click', () => this.init());
        document.getElementById('continue-btn').addEventListener('click', () => this.continueGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.init());

        window.addEventListener('resize', () => this.updateInstructions());
        this.updateInstructions();
    }

    handleKeydown(e) {
        if (this.isAnimating) return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }

        const directionMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        const direction = directionMap[e.key];
        if (direction) {
            this.move(direction);
        }
    }

    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        const container = document.getElementById('game-container');

        container.addEventListener('touchstart', (e) => {
            if (this.gameStateActive()) {
                e.preventDefault();
            }
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            if (this.isAnimating) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            const minDistance = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minDistance) {
                    this.move(deltaX > 0 ? 'right' : 'left');
                }
            } else {
                if (Math.abs(deltaY) > minDistance) {
                    this.move(deltaY > 0 ? 'down' : 'up');
                }
            }
        }, { passive: true });
    }

    updateInstructions() {
        const isMobile = window.innerWidth < 768;
        this.instructionsEl.textContent = isMobile ? '滑动屏幕移动方块' : '使用方向键 ↑ ↓ ← → 移动方块';
    }

    move(direction) {
        if (this.isAnimating) return;
        if (!this.gameStateActive()) return;

        const moved = this.executeMove(direction);

        if (moved) {
            this.isAnimating = true;

            setTimeout(() => {
                this.render();
                this.addRandomTile();
                this.render();
                this.updateScoreDisplay();
                this.checkGameState();

                setTimeout(() => {
                    this.isAnimating = false;
                }, 50);
            }, 150);
        }
    }

    executeMove(direction) {
        let moved = false;
        const mergedPositions = [];
        const traversals = this.buildTraversals(direction);
        const merged = Array(4).fill(null).map(() => Array(4).fill(false));

        traversals.rows.forEach(row => {
            traversals.cols.forEach(col => {
                const value = this.grid[row][col];
                if (value !== 0) {
                    const { newRow, newCol, merge } = this.findFarthestPosition(row, col, direction, merged);

                    if (newRow !== row || newCol !== col) {
                        moved = true;
                        this.grid[row][col] = 0;
                        if (merge) {
                            const newValue = value * 2;
                            this.grid[newRow][newCol] = newValue;
                            merged[newRow][newCol] = true;
                            this.score += newValue;
                            mergedPositions.push({ row: newRow, col: newCol });

                            if (newValue === 2048 && !this.hasWon && !this.continueAfterWin) {
                                this.hasWon = true;
                            }
                        } else {
                            this.grid[newRow][newCol] = value;
                        }
                    }
                }
            });
        });

        this.lastMergedPositions = mergedPositions;
        return moved;
    }

    buildTraversals(direction) {
        const rows = [0, 1, 2, 3];
        const cols = [0, 1, 2, 3];

        if (direction === 'down') rows.reverse();
        if (direction === 'right') cols.reverse();

        return { rows, cols };
    }

    findFarthestPosition(row, col, direction, merged) {
        const vectors = {
            up: { row: -1, col: 0 },
            down: { row: 1, col: 0 },
            left: { row: 0, col: -1 },
            right: { row: 0, col: 1 }
        };

        const vector = vectors[direction];
        let newRow = row;
        let newCol = col;

        while (true) {
            const nextRow = newRow + vector.row;
            const nextCol = newCol + vector.col;

            if (nextRow < 0 || nextRow > 3 || nextCol < 0 || nextCol > 3) {
                break;
            }

            if (this.grid[nextRow][nextCol] !== 0) {
                if (
                    this.grid[nextRow][nextCol] === this.grid[row][col] &&
                    !merged[nextRow][nextCol]
                ) {
                    return { newRow: nextRow, newCol: nextCol, merge: true };
                }
                break;
            }

            newRow = nextRow;
            newCol = nextCol;
        }

        return { newRow, newCol, merge: false };
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[randomCell.row][randomCell.col] = value;
            this.lastNewTile = randomCell;
        }
    }

    render() {
        this.tileContainer.innerHTML = '';

        const containerRect = this.tileContainer.getBoundingClientRect();
        const gap = window.innerWidth < 768 ? 8 : 10;
        const cellSize = (containerRect.width - gap * 3) / 4;

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const value = this.grid[row][col];
                if (value !== 0) {
                    const tile = this.createTileElement(value, row, col, cellSize, gap);
                    this.tileContainer.appendChild(tile);
                }
            }
        }
    }

    createTileElement(value, row, col, cellSize, gap) {
        const tile = document.createElement('div');
        tile.className = 'tile';

        if (value <= 2048) {
            tile.classList.add(`tile-${value}`);
        } else {
            tile.classList.add('tile-super');
        }

        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;
        tile.style.left = `${col * (cellSize + gap)}px`;
        tile.style.top = `${row * (cellSize + gap)}px`;
        tile.textContent = value;

        if (this.lastMergedPositions) {
            const isMerged = this.lastMergedPositions.some(
                pos => pos.row === row && pos.col === col
            );
            if (isMerged) {
                tile.classList.add('tile-merged');
            }
        }

        if (this.lastNewTile && this.lastNewTile.row === row && this.lastNewTile.col === col) {
            tile.classList.add('tile-new');
        }

        return tile;
    }

    updateScoreDisplay() {
        this.currentScoreEl.textContent = this.formatNumber(this.score);
        this.currentScoreEl.classList.add('score-pop');
        setTimeout(() => this.currentScoreEl.classList.remove('score-pop'), 150);

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        this.bestScoreEl.textContent = this.formatNumber(this.bestScore);
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    checkGameState() {
        if (this.hasWon && !this.continueAfterWin) {
            this.showWinOverlay();
            return;
        }

        if (!this.canMove()) {
            setTimeout(() => {
                this.showGameOverOverlay();
            }, 500);
        }
    }

    canMove() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === 0) {
                    return true;
                }
            }
        }

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.grid[row][col] === this.grid[row][col + 1]) {
                    return true;
                }
            }
        }

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === this.grid[row + 1][col]) {
                    return true;
                }
            }
        }

        return false;
    }

    gameStateActive() {
        return !this.hasWon || this.continueAfterWin;
    }

    showWinOverlay() {
        this.winOverlay.classList.add('active');
    }

    showGameOverOverlay() {
        this.finalScoreEl.textContent = this.formatNumber(this.score);
        this.gameoverOverlay.classList.add('active');
    }

    continueGame() {
        this.continueAfterWin = true;
        this.winOverlay.classList.remove('active');
    }

    loadBestScore() {
        const saved = localStorage.getItem('bestScore2048');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveBestScore() {
        localStorage.setItem('bestScore2048', this.bestScore.toString());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
