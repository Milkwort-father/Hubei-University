// 获取画布元素和 2D 渲染上下文
// 连接 WebSocket 服务器
const socket = new WebSocket('ws://localhost:8080');

// 存储其他玩家的蛇
const otherSnakes = [];

// 处理服务器消息
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'snakeUpdate') {
        // 找到对应的其他玩家的蛇并更新位置
        let found = false;
        for (let i = 0; i < otherSnakes.length; i++) {
            if (otherSnakes[i].id === data.id) {
                otherSnakes[i].body = data.body;
                found = true;
                break;
            }
        }
        if (!found) {
            otherSnakes.push({ id: data.id, body: data.body });
        }
    }
};
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 设置画布尺寸 - 适配iPhone6 (375x667)
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
canvas.width = isMobile ? 250 : 800;
canvas.height = isMobile ? 250 : 600;

// 网格大小和格子数量
const gridSize = 20;
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;

// 蛇的初始状态
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };

// 食物的位置
let food = { x: Math.floor(Math.random() * tileCountX), y: Math.floor(Math.random() * tileCountY) };

// 游戏配置常量
const GAME_CONFIG = {
    SPEED: 150, // 默认速度(简单难度)
    GRID_SIZE: 20,
    SNAKE_COLOR: '#4CAF50',
    FOOD_COLOR: '#F44336',
    BG_COLOR: '#222'
};

// 游戏分数
let score = 0;

// 游戏状态
let gameRunning = false;
let gamePaused = false;
let gameLoopId;

// 绘制函数
function draw() {
    // 清除画布
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制自己的蛇
    ctx.fillStyle = '#4CAF50';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    // 绘制其他玩家的蛇
    otherSnakes.forEach(otherSnake => {
        ctx.fillStyle = 'blue';
        otherSnake.body.forEach(segment => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        });
    });

    // 绘制食物
    ctx.fillStyle = '#F44336';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}


// 更新函数
function update() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    snake.unshift(head);

    // 检查是否吃到食物
if (head.x === food.x && head.y === food.y) {
    // 生成新的食物
    food = { x: Math.floor(Math.random() * tileCountX), y: Math.floor(Math.random() * tileCountY) };
    // 增加分数
    score += 10;
    document.getElementById('score').textContent = score;
} else {
    // 移除蛇尾
    snake.pop();
}

    // 检查是否撞到边界或自己
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        // 游戏结束逻辑，这里简单地重置游戏
        snake = [{ x: 10, y: 10 }];
        direction = { x: 0, y: 0 };
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            // 游戏结束逻辑，这里简单地重置游戏
            snake = [{ x: 10, y: 10 }];
            direction = { x: 0, y: 0 };
        }
    }
}

// 游戏循环
function gameLoop() {
    if (!gamePaused) {
        update();
        draw();
    }
    gameLoopId = setTimeout(gameLoop, 150);
}

// 监听键盘事件
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            if (direction.y !== 1) direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y !== -1) direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x !== 1) direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x !== -1) direction = { x: 1, y: 0 };
            break;
    }
});

// 按钮事件监听
document.getElementById('startBtn').addEventListener('click', () => {
    if (!gameRunning) {
        // 获取选择的难度
        const difficulty = parseInt(document.getElementById('difficulty').value);
        GAME_CONFIG.SPEED = difficulty;
        
        // 重置游戏状态
        gameRunning = true;
        gamePaused = false;
        score = 0;
        document.getElementById('score').textContent = score;
        
        gameLoop();
    } else {
        gamePaused = !gamePaused;
        document.getElementById('pauseBtn').textContent = gamePaused ? '继续' : '暂停';
    }
});

document.getElementById('pauseBtn').addEventListener('click', function() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        this.textContent = gamePaused ? '继续' : '暂停';
    }
});

// 方向按钮控制
document.getElementById('upBtn').addEventListener('click', () => {
    if (direction.y !== 1) direction = { x: 0, y: -1 };
});

document.getElementById('downBtn').addEventListener('click', () => {
    if (direction.y !== -1) direction = { x: 0, y: 1 };
});

document.getElementById('leftBtn').addEventListener('click', () => {
    if (direction.x !== 1) direction = { x: -1, y: 0 };
});

document.getElementById('rightBtn').addEventListener('click', () => {
    if (direction.x !== -1) direction = { x: 1, y: 0 };
});

// 触摸事件支持 - 优化响应速度
const touchHandler = (e) => {
    e.preventDefault(); // 阻止默认行为提高响应速度
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const canvasRect = canvas.getBoundingClientRect();
    
    // 简化计算逻辑
    const diffX = touchX - (canvasRect.left + canvas.width / 2);
    const diffY = touchY - (canvasRect.top + canvas.height / 2);
    
    // 降低灵敏度阈值，使操作更灵敏
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        direction = diffX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else if (Math.abs(diffY) > 10) {
        direction = diffY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
};

canvas.addEventListener('touchstart', touchHandler);
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    touchHandler(e);
});

// 定时发送自己的蛇的位置给服务器
setInterval(() => {
    if (gameRunning && !gamePaused) {
        socket.send(JSON.stringify({
            type: 'snakeUpdate',
            id: Date.now(), // 简单用时间戳作为 ID
            body: snake
        }));
    }
}, gameSpeed);
