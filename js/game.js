class Game2048 {
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
        
        this.lastNewTile = null;
        this.lastMergedSet = new Set();
        this.newTileSet = new Set();
        
        this.moveHistory = [];
        this.isReplaying = false;
        
        this.tileContainer = document.getElementById('tile-container');
        this.gridBackground = document.getElementById('grid-background');
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
        
        this.audioContext = null;
        this.soundQueue = [];
        this.isPlayingSound = false;
        
        this.cellSize = 0;
        this.gap = 0;
        this.padding = 0;
        
        this.resizeTimeout = null;
        this.renderRequested = false;
        this.scorePopTimeout = null;
        this.scorePopTimeout2 = null;
        
        this.init();
        this.setupEventListeners();
        this.loadTheme();
        this.loadSettings();
        this.calculateDimensions();
    }
    
    init() {
        this.isAnimating = false;
        this.isPaused = false;
        this.hasWon = false;
        this.continueAfterWin = false;
        this.score = 0;
        this.moveCount = 0;
        this.moveHistory = [];
        
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        
        this.lastNewTile = null;
        this.lastMergedSet.clear();
        this.newTileSet.clear();
        
        this.winOverlay.classList.remove('active');
        this.gameoverOverlay.classList.remove('active');
        this.pauseOverlay.classList.remove('active');
        
        this.updateScoreDisplay();
        this.updateMoveCount();
        this.createBackgroundGrid();
        this.tileContainer.innerHTML = ''; 
        
        this.addRandomTile();
        this.addRandomTile();
        this.scheduleRender();
    }
    
    createBackgroundGrid() {
        this.gridBackground.innerHTML = ''; 
        this.gridBackground.className = 'grid-background' + (this.gridSize === 5 ? ' grid-5' : '');
        
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
        document.addEventListener('keydown', (e) => this.handleKeydown(e), { passive: true });
        this.setupTouchControls();
        
        document.getElementById('new-game-btn').addEventListener('click', () => this.init());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());
        
        document.getElementById('retry-btn').addEventListener('click', () => this.init());
        document.getElementById('continue-btn').addEventListener('click', () => this.continueGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.init());
        
        document.getElementById('settings-close').addEventListener('click', () => this.hideSettings());
        document.getElementById('apply-settings').addEventListener('click', () => this.applySettings());
        document.getElementById('leaderboard-close').addEventListener('click', () => this.hideLeaderboard());
        document.getElementById('clear-leaderboard').addEventListener('click', () => this.clearLeaderboard());
        
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

        this.gap = this.gridSize === 5 ? 6 : (isMobile ? 8 : 10);
        this.cellSize = (containerRect.width - this.gap * (this.gridSize - 1)) / this.gridSize;
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
            case 'slow': return 280;
            case 'fast': return 60;
            default: return 100;
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

        // 收集现有方块
        Array.from(this.tileContainer.children).forEach(tile => {
            const key = tile.getAttribute('data-position');
            if (key) {
                tilesToRemove.add(key);
                existingTiles.set(key, tile);
            }
        });

        const fragment = document.createDocumentFragment();

        // 渲染当前网格中的方块
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
                        // 更新现有方块
                        if (tile.textContent !== value.toString()) {
                            tile.textContent = value;
                        }
                        this.updateTileClasses(tile, value, isNew, isMerged);
                    } else {
                        // 创建新方块
                        tile = this.createTileElement(value, row, col, isNew, isMerged);
                    }

                    // 更新位置和大小
                    this.updateTilePosition(tile, row, col);
                    tile.setAttribute('data-position', key);
                    fragment.appendChild(tile);
                }
            }
        }

        // 移除不需要的方块
        tilesToRemove.forEach(key => {
            const tile = existingTiles.get(key);
            if (tile) {
                tile.remove();
            }
        });

        // 添加新方块到容器
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
        
        const baseFontSize = this.gridSize === 5 ? 28 : 44;
        const fontSize = Math.max(16, baseFontSize - Math.floor(Math.log2(value)) * 2);
        tile.style.fontSize = `${fontSize}px`; 
    }
    
    updateTilePosition(tile, row, col) {
        const x = col * (this.cellSize + this.gap);
        const y = row * (this.cellSize + this.gap);
        
        tile.style.width = `${this.cellSize}px`; 
        tile.style.height = `${this.cellSize}px`; 
        tile.style.transform = `translate(${x}px, ${y}px)`; 
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
        
        this.scorePopup.textContent = `+${points}`;
        this.scorePopup.classList.add('show');
        
        if (this.scorePopTimeout) {
            clearTimeout(this.scorePopTimeout);
        }
        
        this.scorePopTimeout = setTimeout(() => {
            this.scorePopup.classList.remove('show');
        }, 600);
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
            if (this.soundEnabled) {
                this.queueSound('win');
            }
            setTimeout(() => this.showWinOverlay(), 150);
            return;
        }
        
        if (!this.canMove()) {
            if (this.soundEnabled) {
                this.queueSound('lose');
            }
            this.saveToLeaderboard();
            setTimeout(() => this.showGameOverOverlay(), 200);
        }
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
    
    showWinOverlay() {
        this.winScoreEl.textContent = this.formatNumber(this.score);
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
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseOverlay.classList.toggle('active', this.isPaused);
        document.getElementById('pause-btn').textContent = this.isPaused ? '继续' : '暂停';
    }
    
    loadBestScore() {
        const saved = localStorage.getItem('bestScore2048');
        return saved ? parseInt(saved, 10) : 0;
    }
    
    saveBestScore() {
        localStorage.setItem('bestScore2048', this.bestScore.toString());
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
        localStorage.setItem('theme2048', newTheme);
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme2048') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
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
        }
        
        this.hideSettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('settings2048');
        if (saved) {
            const settings = JSON.parse(saved);
            this.gameSpeed = settings.speed || 'normal';
            this.soundEnabled = settings.sound !== undefined ? settings.sound : true;
            this.animationEnabled = settings.animation !== undefined ? settings.animation : true;
        }
        
        this.gameModeEl.textContent = this.gameSpeed === 'slow' ? '慢速' : 
                                     this.gameSpeed === 'fast' ? '快速' : '标准';
        this.gridSizeEl.textContent = `${this.gridSize}×${this.gridSize}`;
    }
    
    saveSettings() {
        const settings = {
            speed: this.gameSpeed,
            sound: this.soundEnabled,
            animation: this.animationEnabled
        }; 
        localStorage.setItem('settings2048', JSON.stringify(settings));
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
        
        listEl.innerHTML = leaderboard.map((entry, index) => `
            <div class="leaderboard-item">
                <span class="rank">${index + 1}</span>
                <span class="score">${this.formatNumber(entry.score)}</span>
                <span class="date">${entry.date}</span>
            </div>
        `).join('');
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('leaderboard2048');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveLeaderboard(entries) {
        localStorage.setItem('leaderboard2048', JSON.stringify(entries));
    }
    
    saveToLeaderboard() {
        const leaderboard = this.loadLeaderboard();
        const newEntry = {
            score: this.score,
            date: new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        }; 
        
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        
        const top10 = leaderboard.slice(0, 10);
        this.saveLeaderboard(top10);
    }
    
    clearLeaderboard() {
        if (confirm('确定要清空排行榜吗？')) {
            this.saveLeaderboard([]);
            this.renderLeaderboard();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});