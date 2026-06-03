/**
 * 2048游戏主类 - 最终版全功能
 * 负责处理游戏的核心逻辑、UI渲染、数据存储、
 * 成就系统、排行榜、分享、动画等功能
 */
class Game2048 {
    /**
     * 构造函数 - 初始化游戏
     */
    constructor() {
        this.gridSize = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.moveCount = 0;
        this.isAnimating = false;
        this.isPaused = false;
        this.hasWon = false;
        this.continueAfterWin = false;
        this.gameSpeed = 'normal';
        this.soundEnabled = true;
        this.animationEnabled = true;
        this.gameStartTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.lastNewTile = null;
        this.lastMergedSet = new Set();
        this.newTileSet = new Set();
        this.moveHistory = [];
        this.isReplaying = false;
        this.currentSortMode = 'score';
        this.achievementDefs = [
            { id: 'ACH_001', name: '首次通关', desc: '合成2048方块', icon: '🏆', check: (value) => value === 2048 },
            { id: 'ACH_002', name: '满分挑战', desc: '达到4096或更高', icon: '🌟', check: (value) => value >= 4096 },
            { id: 'ACH_003', name: '速度之王', desc: '60秒内合成1024', icon: '⚡', check: (value) => value >= 1024 && this.getElapsedSeconds() <= 60 }
        ];
        this.tileContainer = document.getElementById('tile-container');
        this.gridBackground = document.getElementById('grid-background');
        this.gameContainer = document.getElementById('game-container');
        this.currentScoreEl = document.getElementById('current-score');
        this.bestScoreEl = document.getElementById('best-score');
        this.winOverlay = document.getElementById('win-overlay');
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.winScoreEl = document.getElementById('win-score');
        this.finalScoreEl = document.getElementById('final-score');
        this.instructionsEl = document.getElementById('instructions');
        this.moveCountEl = document.getElementById('move-count');
        this.gameModeEl = document.getElementById('game-mode');
        this.gridSizeEl = document.getElementById('grid-size');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.scorePopup = document.getElementById('score-popup');
        this.gameTimeEl = document.getElementById('game-time');
        this.loadingScreen = document.getElementById('loading-screen');
        this.audioContext = null;
        this.soundQueue = [];
        this.isPlayingSound = false;
        this.cellSize = 0;
        this.gap = 0;
        this.resizeTimeout = null;
        this.renderRequested = false;
        this.scorePopTimeout2 = null;
        this.confirmCallback = null;
        this.loadTheme();
        this.setupEventListeners();
        this.loadSettings();
        this.showLoadingScreen();
        requestAnimationFrame(() => {
            this.init();
            this.calculateDimensions();
            this.scheduleRender();
        });
    }

    showLoadingScreen() {
        this.loadingScreen.classList.remove('hidden');
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
        }, 1500);
    }

    init() {
        this.isAnimating = false;
        this.isPaused = false;
        this.hasWon = false;
        this.continueAfterWin = false;
        this.score = 0;
        this.moveCount = 0;
        this.moveHistory = [];
        this.elapsedSeconds = 0;
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        this.lastNewTile = null;
        this.lastMergedSet.clear();
        this.newTileSet.clear();
        this.hideOverlays();
        this.gameContainer.classList.remove('win-glow', 'game-over-dim');
        this.updateScoreDisplay();
        this.updateMoveCount();
        this.updateTimerDisplay();
        this.createBackgroundGrid();
        this.tileContainer.innerHTML = '';
        this.addRandomTile();
        this.addRandomTile();
        this.scheduleRender();
        if (this.animationEnabled) {
            this.gameContainer.classList.add('grid-reveal');
            setTimeout(() => {
                this.gameContainer.classList.remove('grid-reveal');
            }, 500);
        }
        this.startTimer();
        const stats = this.loadPlayerStats();
        stats.totalGames = (stats.totalGames || 0) + 1;
        this.savePlayerStats(stats);
    }

    startTimer() {
        this.stopTimer();
        this.gameStartTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    getElapsedSeconds() {
        if (this.gameStartTime) {
            return Math.floor((Date.now() - this.gameStartTime) / 1000);
        }
        return this.elapsedSeconds;
    }

    updateTimerDisplay() {
        if (this.gameTimeEl) {
            const secs = this.getElapsedSeconds();
            this.gameTimeEl.textContent = this.formatTime(secs);
        }
    }

    createBackgroundGrid() {
        this.gridBackground.innerHTML = '';
        const gridClass = this.gridSize === 3 ? ' grid-3' : this.gridSize === 5 ? ' grid-5' : '';
        this.gridBackground.className = 'grid-background' + gridClass;
        this.tileContainer.className = 'tile-container' + gridClass;
        const totalCells = this.gridSize * this.gridSize;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            fragment.appendChild(cell);
        }
        this.gridBackground.appendChild(fragment);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.setupTouchControls();
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.init();
            this.calculateDimensions();
        });
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());
        const resumeBtn = document.getElementById('resume-btn-small');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.showResume());
        }
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.init();
            this.calculateDimensions();
        });
        document.getElementById('continue-btn').addEventListener('click', () => this.continueGame());
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.init();
            this.calculateDimensions();
        });
        document.getElementById('settings-close').addEventListener('click', () => this.hideSettings());
        document.getElementById('apply-settings').addEventListener('click', () => this.applySettings());
        document.getElementById('leaderboard-close').addEventListener('click', () => this.hideLeaderboard());
        document.getElementById('clear-leaderboard').addEventListener('click', () => this.clearLeaderboard());
        const sortScoreBtn = document.getElementById('sort-score');
        const sortTimeBtn = document.getElementById('sort-time');
        if (sortScoreBtn) {
            sortScoreBtn.addEventListener('click', () => {
                this.currentSortMode = 'score';
                sortScoreBtn.classList.add('active');
                if (sortTimeBtn) sortTimeBtn.classList.remove('active');
                this.renderLeaderboard();
            });
        }
        if (sortTimeBtn) {
            sortTimeBtn.addEventListener('click', () => {
                this.currentSortMode = 'time';
                sortTimeBtn.classList.add('active');
                if (sortScoreBtn) sortScoreBtn.classList.remove('active');
                this.renderLeaderboard();
            });
        }
        const winCopy = document.getElementById('win-copy');
        const winScreen = document.getElementById('win-screenshot');
        if (winCopy) winCopy.addEventListener('click', () => this.copyBattleRecord());
        if (winScreen) winScreen.addEventListener('click', () => this.exportScreenshot());
        const goCopy = document.getElementById('gameover-copy');
        const goScreen = document.getElementById('gameover-screenshot');
        if (goCopy) goCopy.addEventListener('click', () => this.copyBattleRecord());
        if (goScreen) goScreen.addEventListener('click', () => this.exportScreenshot());
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            document.getElementById('confirm-modal').classList.remove('active');
            this.confirmCallback = null;
        });
        document.getElementById('confirm-ok').addEventListener('click', () => {
            document.getElementById('confirm-modal').classList.remove('active');
            if (this.confirmCallback) {
                this.confirmCallback();
                this.confirmCallback = null;
            }
        });
        document.getElementById('nickname-skip').addEventListener('click', () => {
            document.getElementById('nickname-modal').classList.remove('active');
        });
        document.getElementById('nickname-submit').addEventListener('click', () => this.submitNickname());
        document.getElementById('nickname-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitNickname();
        });
        const resumeClose = document.getElementById('resume-close');
        if (resumeClose) resumeClose.addEventListener('click', () => this.hideResume());
        const resumeSave = document.getElementById('resume-save');
        if (resumeSave) resumeSave.addEventListener('click', () => this.saveResumeNickname());
        const guideClose = document.getElementById('guide-close');
        const guideStart = document.getElementById('guide-start');
        if (guideClose) guideClose.addEventListener('click', () => this.hideGuide());
        if (guideStart) guideStart.addEventListener('click', () => this.hideGuide());
        window.addEventListener('resize', () => this.handleResize(), { passive: true });
        this.updateInstructions();
    }

    handleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.updateInstructions();
            this.calculateDimensions();
            if (!this.isAnimating && !this.isPaused) {
                this.scheduleRender();
            }
        }, 100);
    }

    calculateDimensions() {
        const tileContainer = document.getElementById('tile-container');
        const containerRect = tileContainer.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        if (this.gridSize === 3) {
            this.gap = isMobile ? 10 : 12;
        } else if (this.gridSize === 5) {
            this.gap = isMobile ? 6 : 8;
        } else {
            this.gap = isMobile ? 8 : 10;
        }
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        this.cellSize = Math.min(
            (containerWidth - this.gap * (this.gridSize - 1)) / this.gridSize,
            (containerHeight - this.gap * (this.gridSize - 1)) / this.gridSize
        );
        this.cellSize = Math.floor(this.cellSize);
        this.tileContainer.style.setProperty('--grid-gap', `${this.gap}px`);
        this.gridBackground.style.setProperty('--grid-gap', `${this.gap}px`);
        const computedStyle = window.getComputedStyle(this.gameContainer);
        const paddingTop = parseInt(computedStyle.paddingTop);
        this.tileContainer.style.setProperty('--grid-padding', `${paddingTop}px`);
    }

    handleKeydown(e) {
        if (this.isAnimating || this.isReplaying) return;
        const directionMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };
        const direction = directionMap[e.key];
        if (direction) {
            e.preventDefault();
            this.move(direction);
        }
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
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
            if (this.isAnimating || this.isPaused || this.isReplaying) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minDistance = 25;
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
        this.instructionsEl.textContent = isMobile
            ? '滑动屏幕移动方块 | 点击暂停'
            : '使用方向键移动 | P键暂停';
    }

    getSpeedDelay() {
        switch (this.gameSpeed) {
            case 'slow': return 300;
            case 'fast': return 120;
            default: return 180;
        }
    }

    move(direction) {
        if (this.isAnimating || this.isPaused) return;
        if (!this.gameStateActive()) return;
        const moved = this.executeMove(direction);
        if (moved) {
            this.isAnimating = true;
            this.moveCount++;
            this.moveHistory.push(direction);
            if (this.soundEnabled) {
                this.queueSound('move');
            }
            requestAnimationFrame(() => {
                this.scheduleRender();
            });
            setTimeout(() => {
                this.addRandomTile();
                this.scheduleRender();
                this.updateScoreDisplay();
                this.updateMoveCount();
                this.checkGameState();
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        this.isAnimating = false;
                        this.lastMergedSet.clear();
                        this.newTileSet.clear();
                    }, 60);
                });
            }, this.getSpeedDelay());
        }
    }

    executeMove(direction) {
        let moved = false;
        const mergedPositions = [];
        const traversals = this.buildTraversals(direction);
        const merged = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
        for (let i = 0; i < traversals.rows.length; i++) {
            const row = traversals.rows[i];
            for (let j = 0; j < traversals.cols.length; j++) {
                const col = traversals.cols[j];
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
                            mergedPositions.push(`${newRow}-${newCol}`);
                            if (this.soundEnabled) {
                                this.queueSound('merge');
                            }
                            if (this.animationEnabled) {
                                this.showScorePopup(newValue);
                            }
                            this.checkAchievements(newValue);
                            if (newValue === 2048 && !this.hasWon && !this.continueAfterWin) {
                                this.hasWon = true;
                            }
                        } else {
                            this.grid[newRow][newCol] = value;
                        }
                    }
                }
            }
        }
        this.lastMergedSet = new Set(mergedPositions);
        return moved;
    }

    buildTraversals(direction) {
        const rows = Array.from({ length: this.gridSize }, (_, i) => i);
        const cols = Array.from({ length: this.gridSize }, (_, i) => i);
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
            if (nextRow < 0 || nextRow >= this.gridSize || nextCol < 0 || nextCol >= this.gridSize) {
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
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
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
            this.newTileSet.add(`${randomCell.row}-${randomCell.col}`);
        }
    }

    render() {
        if (!this.cellSize || this.cellSize <= 0) {
            this.calculateDimensions();
        }
        const existingTiles = new Map();
        const tilesToRemove = new Set();
        Array.from(this.tileContainer.children).forEach(tile => {
            const key = tile.getAttribute('data-position');
            if (key) {
                tilesToRemove.add(key);
                existingTiles.set(key, tile);
            }
        });
        const fragment = document.createDocumentFragment();
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const value = this.grid[row][col];
                if (value !== 0) {
                    const key = `${row}-${col}`;
                    tilesToRemove.delete(key);
                    let tile = existingTiles.get(key);
                    const isNew = this.newTileSet.has(key);
                    const isMerged = this.lastMergedSet.has(key);
                    if (tile) {
                        if (tile.textContent !== value.toString()) {
                            tile.textContent = value;
                        }
                        this.updateTileClasses(tile, value, isNew, isMerged);
                    } else {
                        tile = this.createTileElement(value, row, col, isNew, isMerged);
                    }
                    this.updateTilePosition(tile, row, col);
                    tile.setAttribute('data-position', key);
                    fragment.appendChild(tile);
                }
            }
        }
        tilesToRemove.forEach(key => {
            const tile = existingTiles.get(key);
            if (tile) {
                tile.remove();
            }
        });
        this.tileContainer.appendChild(fragment);
    }

    createTileElement(value, row, col, isNew, isMerged) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.setAttribute('data-position', `${row}-${col}`);
        tile.setAttribute('will-change', 'transform, opacity');
        this.updateTileClasses(tile, value, isNew, isMerged);
        tile.textContent = value;
        return tile;
    }

    updateTileClasses(tile, value, isNew, isMerged) {
        tile.classList.remove(
            'tile-2', 'tile-4', 'tile-8', 'tile-16', 'tile-32', 'tile-64',
            'tile-128', 'tile-256', 'tile-512', 'tile-1024', 'tile-2048', 'tile-super',
            'tile-new', 'tile-merged'
        );
        if (value <= 2048) {
            tile.classList.add(`tile-${value}`);
        } else {
            tile.classList.add('tile-super');
        }
        if (isNew) {
            tile.classList.add('tile-new');
        }
        if (isMerged) {
            tile.classList.add('tile-merged');
        }
        const baseFontSize = this.gridSize === 3 ? 56 : (this.gridSize === 5 ? 28 : 44);
        const fontSize = Math.max(14, baseFontSize - Math.floor(Math.log2(value)) * 2);
        tile.style.fontSize = `${fontSize}px`;
    }

    updateTilePosition(tile, row, col) {
        tile.style.gridRow = row + 1;
        tile.style.gridColumn = col + 1;
        tile.style.transform = 'translate(0, 0)';
    }

    renderFrame = () => {
        this.render();
        this.renderRequested = false;
    }

    scheduleRender() {
        if (!this.renderRequested) {
            this.renderRequested = true;
            requestAnimationFrame(this.renderFrame);
        }
    }

    showScorePopup(points) {
        if (!this.animationEnabled) return;
        const popup = document.createElement('div');
        popup.className = 'score-popup show';
        popup.textContent = `+${points}`;
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.remove();
        }, 700);
    }

    updateScoreDisplay() {
        this.currentScoreEl.textContent = this.formatNumber(this.score);
        this.currentScoreEl.classList.add('score-pop');
        if (this.scorePopTimeout2) {
            clearTimeout(this.scorePopTimeout2);
        }
        this.scorePopTimeout2 = setTimeout(() => {
            this.currentScoreEl.classList.remove('score-pop');
        }, 100);
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        this.bestScoreEl.textContent = this.formatNumber(this.bestScore);
    }

    updateMoveCount() {
        this.moveCountEl.textContent = this.moveCount;
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    checkGameState() {
        if (this.hasWon && !this.continueAfterWin) {
            this.stopTimer();
            if (this.soundEnabled) {
                this.queueSound('win');
            }
            this.updatePlayerStatsOnWin();
            this.saveToLeaderboard();
            setTimeout(() => this.showWinOverlay(), 200);
            return;
        }
        if (!this.canMove()) {
            this.stopTimer();
            if (this.soundEnabled) {
                this.queueSound('lose');
            }
            this.updatePlayerStatsOnLose();
            this.saveToLeaderboard();
            setTimeout(() => this.showGameOverOverlay(), 250);
        }
    }

    updatePlayerStatsOnWin() {
        const stats = this.loadPlayerStats();
        stats.totalGames = (stats.totalGames || 0) + 1;
        stats.wins = (stats.wins || 0) + 1;
        if (!stats.firstPlayDate) stats.firstPlayDate = new Date().toISOString().split('T')[0];
        stats.totalPlayTime = (stats.totalPlayTime || 0) + this.getElapsedSeconds();
        if (this.score > (stats.bestScore || 0)) {
            stats.bestScore = this.score;
        }
        stats.totalMoves = (stats.totalMoves || 0) + this.moveCount;
        this.savePlayerStats(stats);
    }

    updatePlayerStatsOnLose() {
        const stats = this.loadPlayerStats();
        stats.totalGames = (stats.totalGames || 0) + 1;
        if (!stats.firstPlayDate) stats.firstPlayDate = new Date().toISOString().split('T')[0];
        stats.totalPlayTime = (stats.totalPlayTime || 0) + this.getElapsedSeconds();
        if (this.score > (stats.bestScore || 0)) {
            stats.bestScore = this.score;
        }
        stats.totalMoves = (stats.totalMoves || 0) + this.moveCount;
        this.savePlayerStats(stats);
    }

    showWinOverlay() {
        this.winScoreEl.textContent = this.formatNumber(this.score);
        const winMoves = document.getElementById('win-moves');
        const winTime = document.getElementById('win-time');
        if (winMoves) winMoves.textContent = this.moveCount;
        if (winTime) winTime.textContent = this.formatTime(this.getElapsedSeconds());
        this.winOverlay.classList.add('active');
        if (this.animationEnabled) {
            this.gameContainer.classList.add('win-glow');
            setTimeout(() => {
                this.gameContainer.classList.remove('win-glow');
            }, 6000);
        }
    }

    showGameOverOverlay() {
        this.finalScoreEl.textContent = this.formatNumber(this.score);
        const goMoves = document.getElementById('gameover-moves');
        const goTime = document.getElementById('gameover-time');
        if (goMoves) goMoves.textContent = this.moveCount;
        if (goTime) goTime.textContent = this.formatTime(this.getElapsedSeconds());
        this.gameoverOverlay.classList.add('active');
        if (this.animationEnabled) {
            this.gameContainer.classList.add('game-over-dim');
            setTimeout(() => {
                this.gameContainer.classList.remove('game-over-dim');
            }, 600);
        }
    }

    hideOverlays() {
        this.winOverlay.classList.remove('active');
        this.gameoverOverlay.classList.remove('active');
        this.pauseOverlay.classList.remove('active');
    }

    canMove() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    return true;
                }
            }
        }
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 1; col++) {
                if (this.grid[row][col] === this.grid[row][col + 1]) {
                    return true;
                }
            }
        }
        for (let row = 0; row < this.gridSize - 1; row++) {
            for (let col = 0; col < this.gridSize; col++) {
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

    continueGame() {
        this.continueAfterWin = true;
        this.winOverlay.classList.remove('active');
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseOverlay.classList.toggle('active', this.isPaused);
        document.getElementById('pause-btn').textContent = this.isPaused ? '继续' : '暂停';
        if (this.isPaused) {
            this.stopTimer();
        } else {
            const elapsed = this.elapsedSeconds;
            this.stopTimer();
            this.gameStartTime = Date.now() - elapsed * 1000;
            this.timerInterval = setInterval(() => {
                this.elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
                this.updateTimerDisplay();
            }, 1000);
        }
    }

    loadBestScore() {
        try {
            const saved = localStorage.getItem('bestScore2048');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            console.warn('无法读取最佳分数:', e);
            return 0;
        }
    }

    saveBestScore() {
        try {
            localStorage.setItem('bestScore2048', this.bestScore.toString());
        } catch (e) {
            console.warn('无法保存最佳分数:', e);
        }
    }

    queueSound(type) {
        this.soundQueue.push(type);
        if (!this.isPlayingSound) {
            this.playNextSound();
        }
    }

    playNextSound() {
        if (this.soundQueue.length === 0) {
            this.isPlayingSound = false;
            return;
        }
        this.isPlayingSound = true;
        const type = this.soundQueue.shift();
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        const sounds = {
            move: { freq: 400, duration: 0.05, type: 'sine' },
            merge: { freq: 600, duration: 0.08, type: 'sine' },
            win: { freq: 800, duration: 0.25, type: 'sine' },
            lose: { freq: 200, duration: 0.25, type: 'triangle' }
        };
        const sound = sounds[type] || sounds.move;
        oscillator.type = sound.type;
        oscillator.frequency.setValueAtTime(sound.freq, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sound.duration);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + sound.duration);
        setTimeout(() => {
            this.playNextSound();
        }, sound.duration * 1000 + 10);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme2048', newTheme);
        } catch (e) {
            console.warn('无法保存主题设置:', e);
        }
    }

    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('theme2048') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
        } catch (e) {
            console.warn('无法读取主题设置:', e);
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    showSettings() {
        document.getElementById('settings-modal').classList.add('active');
        document.getElementById('grid-select').value = this.gridSize.toString();
        document.getElementById('speed-select').value = this.gameSpeed;
        document.getElementById('sound-toggle').checked = this.soundEnabled;
        document.getElementById('animation-toggle').checked = this.animationEnabled;
    }

    hideSettings() {
        document.getElementById('settings-modal').classList.remove('active');
    }

    applySettings() {
        const newGridSize = parseInt(document.getElementById('grid-select').value, 10);
        const newSpeed = document.getElementById('speed-select').value;
        this.gameSpeed = newSpeed;
        this.soundEnabled = document.getElementById('sound-toggle').checked;
        this.animationEnabled = document.getElementById('animation-toggle').checked;
        this.gameModeEl.textContent = this.gameSpeed === 'slow' ? '慢速' :
                                     this.gameSpeed === 'fast' ? '快速' : '标准';
        this.saveSettings();
        if (newGridSize !== this.gridSize) {
            this.gridSize = newGridSize;
            this.gridSizeEl.textContent = `${this.gridSize}×${this.gridSize}`;
            this.init();
            this.calculateDimensions();
        }
        this.hideSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('settings2048');
            if (saved) {
                const settings = JSON.parse(saved);
                this.gameSpeed = settings.speed || 'normal';
                this.soundEnabled = settings.sound !== undefined ? settings.sound : true;
                this.animationEnabled = settings.animation !== undefined ? settings.animation : true;
                this.gridSize = settings.gridSize || 4;
            }
        } catch (e) {
            console.warn('无法读取游戏设置:', e);
        }
        this.gameModeEl.textContent = this.gameSpeed === 'slow' ? '慢速' :
                                     this.gameSpeed === 'fast' ? '快速' : '标准';
        this.gridSizeEl.textContent = `${this.gridSize}×${this.gridSize}`;
    }

    saveSettings() {
        try {
            const settings = {
                speed: this.gameSpeed,
                sound: this.soundEnabled,
                animation: this.animationEnabled,
                gridSize: this.gridSize
            };
            localStorage.setItem('settings2048', JSON.stringify(settings));
        } catch (e) {
            console.warn('无法保存游戏设置:', e);
        }
    }

    showLeaderboard() {
        document.getElementById('leaderboard-modal').classList.add('active');
        this.renderLeaderboard();
    }

    hideLeaderboard() {
        document.getElementById('leaderboard-modal').classList.remove('active');
    }

    renderLeaderboard() {
        const leaderboard = this.loadLeaderboard();
        const listEl = document.getElementById('leaderboard-list');
        if (leaderboard.length === 0) {
            listEl.innerHTML = '<div class="empty-state">暂无记录</div>';
            return;
        }
        const sorted = [...leaderboard];
        if (this.currentSortMode === 'score') {
            sorted.sort((a, b) => b.score - a.score);
        } else {
            sorted.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
        }
        const medals = ['🥇', '🥈', '🥉'];
        listEl.innerHTML = sorted.map((entry, index) => {
            const medalHtml = index < 3 ? `<span class="rank-medal">${medals[index]}</span>` : `<span class="rank">${index + 1}</span>`;
            const nick = entry.nickname ? `<span class="nickname-display">${this.escapeHtml(entry.nickname)}</span>` : '';
            return `
                <div class="leaderboard-item">
                    ${medalHtml}
                    ${nick}
                    <span class="score">${this.formatNumber(entry.score)}</span>
                    <span class="date">${entry.date}<span class="time-display">${entry.time || ''}</span></span>
                </div>
            `;
        }).join('');
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    loadLeaderboard() {
        try {
            const saved = localStorage.getItem('leaderboard2048');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('无法读取排行榜:', e);
            return [];
        }
    }

    saveLeaderboard(entries) {
        try {
            localStorage.setItem('leaderboard2048', JSON.stringify(entries));
        } catch (e) {
            console.warn('无法保存排行榜:', e);
        }
    }

    saveToLeaderboard() {
        if (this.score < 100) return;
        const leaderboard = this.loadLeaderboard();
        const isNewTop = leaderboard.length < 10 || this.score > leaderboard[leaderboard.length - 1]?.score;
        if (isNewTop) {
            document.getElementById('nickname-score-display').textContent = this.formatNumber(this.score);
            document.getElementById('nickname-input').value = '';
            const stats = this.loadPlayerStats();
            if (stats.nickname) {
                document.getElementById('nickname-input').value = stats.nickname;
            }
            document.getElementById('nickname-modal').classList.add('active');
        } else {
            this.addToLeaderboard('匿名玩家');
        }
    }

    submitNickname() {
        const input = document.getElementById('nickname-input');
        const nickname = input.value.trim() || '匿名玩家';
        document.getElementById('nickname-modal').classList.remove('active');
        this.addToLeaderboard(nickname);
    }

    addToLeaderboard(nickname) {
        const leaderboard = this.loadLeaderboard();
        const now = new Date();
        const newEntry = {
            nickname: nickname,
            score: this.score,
            date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
            time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        };
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        const top10 = leaderboard.slice(0, 10);
        this.saveLeaderboard(top10);
        const stats = this.loadPlayerStats();
        if (!stats.nickname || stats.nickname === '') {
            stats.nickname = nickname;
            this.savePlayerStats(stats);
        }
    }

    clearLeaderboard() {
        this.showConfirmDialog(
            '清空排行榜',
            '确定要清空所有排行榜记录吗？此操作不可撤销。',
            () => {
                this.saveLeaderboard([]);
                this.renderLeaderboard();
            }
        );
    }

    showConfirmDialog(title, message, callback) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        this.confirmCallback = callback;
        document.getElementById('confirm-modal').classList.add('active');
    }

    checkAchievements(mergedValue) {
        const unlocked = this.loadAchievements();
        for (const def of this.achievementDefs) {
            if (!unlocked.includes(def.id) && def.check.call(this, mergedValue)) {
                unlocked.push(def.id);
                this.unlockAchievement(def);
            }
        }
        this.saveAchievements(unlocked);
    }

    unlockAchievement(achievementDef) {
        this.showAchievementToast(achievementDef);
    }

    showAchievementToast(def) {
        const container = document.getElementById('achievement-toast-container');
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <span class="toast-icon">${def.icon}</span>
            <div class="toast-content">
                <span class="toast-title">成就解锁！</span>
                <span class="toast-name">${def.name} - ${def.desc}</span>
            </div>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    loadAchievements() {
        try {
            const saved = localStorage.getItem('achievements2048');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('无法读取成就数据:', e);
            return [];
        }
    }

    saveAchievements(achievements) {
        try {
            localStorage.setItem('achievements2048', JSON.stringify(achievements));
        } catch (e) {
            console.warn('无法保存成就数据:', e);
        }
    }

    getAchievementDefs() {
        return this.achievementDefs;
    }

    showResume() {
        document.getElementById('resume-modal').classList.add('active');
        this.renderResume();
    }

    hideResume() {
        document.getElementById('resume-modal').classList.remove('active');
    }

    renderResume() {}

    saveResumeNickname() {
        this.hideResume();
    }

    loadPlayerStats() {
        try {
            const saved = localStorage.getItem('playerStats2048');
            return saved ? JSON.parse(saved) : {
                nickname: '',
                totalGames: 0,
                bestScore: 0,
                wins: 0,
                totalMoves: 0,
                firstPlayDate: null,
                totalPlayTime: 0
            };
        } catch (e) {
            console.warn('无法读取玩家统计:', e);
            return {
                nickname: '',
                totalGames: 0,
                bestScore: 0,
                wins: 0,
                totalMoves: 0,
                firstPlayDate: null,
                totalPlayTime: 0
            };
        }
    }

    savePlayerStats(stats) {
        try {
            localStorage.setItem('playerStats2048', JSON.stringify(stats));
        } catch (e) {
            console.warn('无法保存玩家统计:', e);
        }
    }

    copyBattleRecord() {
        const secs = this.getElapsedSeconds();
        const text = `【2048战绩】
分数：${this.formatNumber(this.score)}
步数：${this.moveCount}
时长：${this.formatTime(secs)}
${this.hasWon ? '状态：通关成功！' : '状态：游戏结束'}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopyToast('战绩已复制到剪贴板！');
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            this.showCopyToast('战绩已复制到剪贴板！');
        } catch (e) {
            this.showCopyToast('复制失败，请手动复制');
        }
        document.body.removeChild(textarea);
    }

    showCopyToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
            'background:linear-gradient(135deg,#333,#555);color:#fff;padding:12px 24px;border-radius:8px;' +
            'font-size:14px;z-index:10000;box-shadow:0 8px 30px rgba(0,0,0,0.3);animation:toastSlideIn 0.3s ease;';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    exportScreenshot() {
        const container = this.gameContainer;
        const rect = container.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        const bgStyle = getComputedStyle(container);
        ctx.fillStyle = bgStyle.backgroundColor || '#bbada0';
        const radius = parseInt(bgStyle.borderRadius) || 16;
        this.roundRect(ctx, 0, 0, rect.width, rect.height, radius);
        ctx.fill();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const padding = parseInt(bgStyle.padding) || 14;
        ctx.fillStyle = isDark ? 'rgba(80,80,80,0.35)' : 'rgba(238,228,218,0.35)';
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const x = padding + c * (this.cellSize + this.gap);
                const y = padding + r * (this.cellSize + this.gap);
                this.roundRect(ctx, x, y, this.cellSize, this.cellSize, 8);
                ctx.fill();
            }
        }
        const lightColors = {
            2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
            32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
            512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
        };
        const darkColors = {
            2: '#5a5560', 4: '#6b5e7a', 8: '#7c6990', 16: '#8b6fa0',
            32: '#9a7ab5', 64: '#aa85c8', 128: '#b890d0', 256: '#c69ddd',
            512: '#d4a8e8', 1024: '#e0b5f0', 2048: '#f0c8ff'
        };
        const colors = isDark ? darkColors : lightColors;
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const value = this.grid[r][c];
                if (value === 0) continue;
                const x = padding + c * (this.cellSize + this.gap);
                const y = padding + r * (this.cellSize + this.gap);
                ctx.fillStyle = colors[value] || (isDark ? '#4a4458' : '#3c3a32');
                this.roundRect(ctx, x, y, this.cellSize, this.cellSize, 8);
                ctx.fill();
                ctx.fillStyle = value <= 4 ? (isDark ? '#e0e0e0' : '#776e65') : '#f9f6f2';
                ctx.font = `bold ${Math.max(16, this.cellSize * 0.4)}px "Segoe UI", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(value.toString(), x + this.cellSize / 2, y + this.cellSize / 2);
            }
        }
        const link = document.createElement('a');
        link.download = `2048_${this.formatNumber(this.score)}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.showCopyToast('截图已保存！');
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    checkAndShowGuide() {
        try {
            const skipGuide = localStorage.getItem('guide2048');
            if (skipGuide === 'true') return;
        } catch (e) { }
        setTimeout(() => {
            document.getElementById('guide-modal').classList.add('active');
        }, 1600);
    }

    hideGuide() {
        document.getElementById('guide-modal').classList.remove('active');
        const noShow = document.getElementById('guide-no-show');
        if (noShow && noShow.checked) {
            try {
                localStorage.setItem('guide2048', 'true');
            } catch (e) {
                console.warn('无法保存引导设置:', e);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game2048();
    game.checkAndShowGuide();
});