/**
 * 2048 游戏核心逻辑
 * 实现P0（核心功能）、P1（动画效果）、P2（本地存储）功能
 */

class Game2048 {
    constructor() {
        // 游戏状态
        this.grid = [];
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.isAnimating = false;
        this.hasWon = false;
        this.continueAfterWin = false;

        // DOM元素
        this.tileContainer = document.getElementById('tile-container');
        this.gridBackground = document.getElementById('grid-background');
        this.currentScoreEl = document.getElementById('current-score');
        this.bestScoreEl = document.getElementById('best-score');
        this.winOverlay = document.getElementById('win-overlay');
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.finalScoreEl = document.getElementById('final-score');
        this.instructionsEl = document.getElementById('instructions');

        // 初始化
        this.init();
        this.setupEventListeners();
    }

    /**
     * 初始化游戏 - 完全重置所有状态
     */
    init() {
        // 重置动画状态
        this.isAnimating = false;

        // 创建4x4空网格（所有值为0）
        this.grid = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        this.score = 0;
        this.hasWon = false;
        this.continueAfterWin = false;

        // 清除动画状态
        this.lastNewTile = null;
        this.lastMergedPositions = null;
        this.newTiles = [];

        // 隐藏遮罩层
        this.winOverlay.classList.remove('active');
        this.gameoverOverlay.classList.remove('active');

        // 更新分数显示
        this.updateScoreDisplay();

        // 清空并重新创建背景格子
        this.createBackgroundGrid();

        // 清空方块容器（确保没有任何方块显示）
        this.tileContainer.innerHTML = '';

        // 渲染空盘面（此时grid全为0，所以不会渲染任何方块）
        this.render();
    }

    /**
     * 创建背景网格
     */
    createBackgroundGrid() {
        this.gridBackground.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            this.gridBackground.appendChild(cell);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // 触摸事件
        this.setupTouchControls();

        // 按钮事件
        document.getElementById('new-game-btn').addEventListener('click', () => this.init());
        document.getElementById('retry-btn').addEventListener('click', () => this.init());
        document.getElementById('continue-btn').addEventListener('click', () => this.continueGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.init());

        // 窗口大小变化时更新操作提示
        window.addEventListener('resize', () => this.updateInstructions());
        this.updateInstructions();
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e
     */
    handleKeydown(e) {
        if (this.isAnimating) return;

        // 防止方向键滚动页面
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }

        // 方向映射
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

    /**
     * 设置触摸控制
     */
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        const container = document.getElementById('game-container');

        container.addEventListener('touchstart', (e) => {
            // 阻止默认触摸事件（防止页面滚动）
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

            // 移动距离阈值
            const minDistance = 30;

            // 判断滑动方向
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平滑动
                if (Math.abs(deltaX) > minDistance) {
                    this.move(deltaX > 0 ? 'right' : 'left');
                }
            } else {
                // 垂直滑动
                if (Math.abs(deltaY) > minDistance) {
                    this.move(deltaY > 0 ? 'down' : 'up');
                }
            }
        }, { passive: true });
    }

    /**
     * 更新操作提示文本
     */
    updateInstructions() {
        const isMobile = window.innerWidth < 768;
        this.instructionsEl.textContent = isMobile ? '滑动屏幕移动方块' : '使用方向键 ↑ ↓ ← → 移动方块';
    }

    /**
     * 移动方块
     * @param {string} direction - 移动方向
     */
    move(direction) {
        if (this.isAnimating) return;
        if (!this.gameStateActive()) return;

        // 检查是否是第一次操作（空盘面）
        const isFirstMove = this.grid.every(row => row.every(cell => cell === 0));
        if (isFirstMove) {
            // 第一次操作前生成两个初始方块
            this.addRandomTile();
            this.addRandomTile();
            this.render();
            return;
        }

        // 执行移动
        const moved = this.executeMove(direction);

        if (moved) {
            // 标记正在动画中
            this.isAnimating = true;

            // 延迟渲染，等待移动动画完成
            setTimeout(() => {
                this.render();

                // 添加新方块
                this.addRandomTile();
                this.render();

                // 更新分数
                this.updateScoreDisplay();

                // 检查游戏状态
                this.checkGameState();

                // 动画结束
                setTimeout(() => {
                    this.isAnimating = false;
                }, 50);
            }, 150);
        }
    }

    /**
     * 执行移动逻辑
     * @param {string} direction
     * @returns {boolean} 是否发生了移动
     */
    executeMove(direction) {
        let moved = false;
        const mergedPositions = [];

        // 根据方向选择遍历顺序
        const traversals = this.buildTraversals(direction);

        // 清空合并标记
        const merged = Array(4).fill(null).map(() => Array(4).fill(false));

        traversals.rows.forEach(row => {
            traversals.cols.forEach(col => {
                const value = this.grid[row][col];
                if (value !== 0) {
                    const { newRow, newCol, merge } = this.findFarthestPosition(row, col, direction, merged);

                    if (newRow !== row || newCol !== col) {
                        // 方块需要移动
                        moved = true;

                        // 移动方块
                        this.grid[row][col] = 0;
                        if (merge) {
                            // 合并方块
                            const newValue = value * 2;
                            this.grid[newRow][newCol] = newValue;
                            merged[newRow][newCol] = true;
                            this.score += newValue;
                            mergedPositions.push({ row: newRow, col: newCol });

                            // 检查是否胜利
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

        // 存储合并位置用于动画
        this.lastMergedPositions = mergedPositions;

        return moved;
    }

    /**
     * 构建遍历顺序
     * @param {string} direction
     * @returns {Object}
     */
    buildTraversals(direction) {
        const rows = [0, 1, 2, 3];
        const cols = [0, 1, 2, 3];

        // 从移动方向的相反方向开始遍历
        if (direction === 'down') rows.reverse();
        if (direction === 'right') cols.reverse();

        return { rows, cols };
    }

    /**
     * 查找方块移动到的最远位置
     * @param {number} row
     * @param {number} col
     * @param {string} direction
     * @param {Array} merged
     * @returns {Object}
     */
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

        // 向前移动直到遇到边界或障碍物
        while (true) {
            const nextRow = newRow + vector.row;
            const nextCol = newCol + vector.col;

            // 检查是否超出边界
            if (nextRow < 0 || nextRow > 3 || nextCol < 0 || nextCol > 3) {
                break;
            }

            // 检查是否遇到方块
            if (this.grid[nextRow][nextCol] !== 0) {
                // 检查是否可以合并
                if (
                    this.grid[nextRow][nextCol] === this.grid[row][col] &&
                    !merged[nextRow][nextCol]
                ) {
                    // 可以合并
                    return { newRow: nextRow, newCol: nextCol, merge: true };
                }
                break;
            }

            newRow = nextRow;
            newCol = nextCol;
        }

        return { newRow, newCol, merge: false };
    }

    /**
     * 添加随机方块
     */
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
            // 90%概率为2，10%概率为4
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[randomCell.row][randomCell.col] = value;
            this.lastNewTile = randomCell;
            
            // 如果是初始化阶段，记录所有新方块
            if (this.newTiles) {
                this.newTiles.push(randomCell);
            }
        }
    }

    /**
     * 渲染游戏界面
     */
    render() {
        // 清空方块容器
        this.tileContainer.innerHTML = '';

        // 计算格子尺寸 - 使用游戏容器计算
        const gameContainer = document.getElementById('game-container');
        const containerRect = gameContainer.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        const gap = isMobile ? 8 : 10;
        const padding = isMobile ? 8 : 10;
        const cellSize = (containerRect.width - padding * 2 - gap * 3) / 4;

        // 渲染所有方块
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

    /**
     * 创建方块DOM元素
     * @param {number} value
     * @param {number} row
     * @param {number} col
     * @param {number} cellSize
     * @param {number} gap
     * @returns {HTMLElement}
     */
    createTileElement(value, row, col, cellSize, gap) {
        const tile = document.createElement('div');
        tile.className = 'tile';

        // 根据数值添加颜色类
        if (value <= 2048) {
            tile.classList.add(`tile-${value}`);
        } else {
            tile.classList.add('tile-super');
        }

        // 设置位置和尺寸
        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;
        tile.style.left = `${col * (cellSize + gap)}px`;
        tile.style.top = `${row * (cellSize + gap)}px`;

        // 设置文字内容
        tile.textContent = value;

        // 检查是否是合并的方块
        if (this.lastMergedPositions) {
            const isMerged = this.lastMergedPositions.some(
                pos => pos.row === row && pos.col === col
            );
            if (isMerged) {
                tile.classList.add('tile-merged');
            }
        }

        // 检查是否是新生成的方块（支持多个新方块）
        const newTiles = this.newTiles || [this.lastNewTile];
        const isNewTile = newTiles.some(
            pos => pos && pos.row === row && pos.col === col
        );
        if (isNewTile) {
            tile.classList.add('tile-new');
        }

        return tile;
    }

    /**
     * 更新分数显示
     */
    updateScoreDisplay() {
        // 更新当前分数
        this.currentScoreEl.textContent = this.formatNumber(this.score);
        this.currentScoreEl.classList.add('score-pop');
        setTimeout(() => this.currentScoreEl.classList.remove('score-pop'), 150);

        // 更新最高分
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        this.bestScoreEl.textContent = this.formatNumber(this.bestScore);
    }

    /**
     * 格式化数字（添加千位分隔符）
     * @param {number} num
     * @returns {string}
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * 检查游戏状态
     */
    checkGameState() {
        // 检查胜利
        if (this.hasWon && !this.continueAfterWin) {
            this.showWinOverlay();
            return;
        }

        // 检查失败
        if (!this.canMove()) {
            setTimeout(() => {
                this.showGameOverOverlay();
            }, 500);
        }
    }

    /**
     * 判断是否还能移动
     * @returns {boolean}
     */
    canMove() {
        // 检查是否有空格
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === 0) {
                    return true;
                }
            }
        }

        // 检查水平方向是否有相邻相同数字
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.grid[row][col] === this.grid[row][col + 1]) {
                    return true;
                }
            }
        }

        // 检查垂直方向是否有相邻相同数字
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === this.grid[row + 1][col]) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 判断游戏是否进行中
     * @returns {boolean}
     */
    gameStateActive() {
        return !this.hasWon || this.continueAfterWin;
    }

    /**
     * 显示胜利遮罩
     */
    showWinOverlay() {
        this.winOverlay.classList.add('active');
    }

    /**
     * 显示失败遮罩
     */
    showGameOverOverlay() {
        this.finalScoreEl.textContent = this.formatNumber(this.score);
        this.gameoverOverlay.classList.add('active');
    }

    /**
     * 继续游戏（胜利后）
     */
    continueGame() {
        this.continueAfterWin = true;
        this.winOverlay.classList.remove('active');
    }

    /**
     * 加载最高分
     * @returns {number}
     */
    loadBestScore() {
        const saved = localStorage.getItem('bestScore2048');
        return saved ? parseInt(saved, 10) : 0;
    }

    /**
     * 保存最高分
     */
    saveBestScore() {
        localStorage.setItem('bestScore2048', this.bestScore.toString());
    }
}

// 游戏启动
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
