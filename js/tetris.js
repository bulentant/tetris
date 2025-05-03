document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const nextPieceCanvas = document.getElementById('nextPiece');
    const nextPieceCtx = nextPieceCanvas.getContext('2d');
    
    // Game constants
    const BLOCK_SIZE = 30;
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const COLORS = [
        null,
        '#FF0D72', // I
        '#0DC2FF', // J
        '#0DFF72', // L
        '#F538FF', // O
        '#FF8E0D', // S
        '#FFE138', // T
        '#3877FF'  // Z
    ];
    
    // Game variables
    let score = 0;
    let level = 1;
    let lines = 0;
    let dropCounter = 0;
    let dropInterval = 1000; // milliseconds
    let lastTime = 0;
    let paused = false;
    let gameOver = false;
    let board = createBoard();
    let player = {
        pos: {x: 0, y: 0},
        matrix: null,
        next: null
    };
    
    // DOM elements
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    
    // Event listeners
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    document.addEventListener('keydown', handleKeyPress);
    
    // Tetris pieces (tetrominos)
    const PIECES = [
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ], // I
        [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ], // J
        [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ], // L
        [
            [4, 4],
            [4, 4]
        ], // O
        [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ], // S
        [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ], // T
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ]  // Z
    ];
    
    // Create empty game board
    function createBoard() {
        return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    }
    
    // Create a random piece
    function createPiece() {
        const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
        return piece;
    }
    
    // Draw a single block
    function drawBlock(x, y, color, context = ctx) {
        context.fillStyle = color;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeStyle = '#000';
        context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        // Add 3D effect
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.beginPath();
        context.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE);
        context.lineTo((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE);
        context.lineTo(x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
        context.fill();
        
        context.fillStyle = 'rgba(0, 0, 0, 0.1)';
        context.beginPath();
        context.moveTo((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE);
        context.lineTo((x + 1) * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
        context.lineTo(x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
        context.fill();
    }
    
    // Draw the player's piece
    function drawMatrix(matrix, offset, context = ctx) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    drawBlock(
                        x + offset.x,
                        y + offset.y,
                        COLORS[value],
                        context
                    );
                }
            });
        });
    }
    
    // Draw the game board
    function drawBoard() {
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    drawBlock(x, y, COLORS[value]);
                }
            });
        });
    }
    
    // Draw the next piece preview
    function drawNextPiece() {
        nextPieceCtx.fillStyle = '#000';
        nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        
        if (player.next) {
            // Calculate offset to center the piece
            const offset = {
                x: Math.floor((nextPieceCanvas.width / BLOCK_SIZE - player.next[0].length) / 2),
                y: Math.floor((nextPieceCanvas.height / BLOCK_SIZE - player.next.length) / 2)
            };
            
            drawMatrix(player.next, offset, nextPieceCtx);
        }
    }
    
    // Draw everything
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw board and player
        drawBoard();
        if (player.matrix) {
            drawMatrix(player.matrix, player.pos);
        }
        
        // Draw next piece
        drawNextPiece();
        
        // Draw game over or paused text
        if (gameOver) {
            drawGameOverText();
        } else if (paused) {
            drawPausedText();
        }
    }
    
    // Draw game over text
    function drawGameOverText() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText('OYUN BİTTİ', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Skor: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Tekrar başlatmak için', canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('BAŞLAT butonuna basın', canvas.width / 2, canvas.height / 2 + 70);
    }
    
    // Draw paused text
    function drawPausedText() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('DURAKLATILDI', canvas.width / 2, canvas.height / 2);
    }
    
    // Collision detection
    function collide(board, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (board[y + o.y] === undefined ||
                     board[y + o.y][x + o.x] === undefined ||
                     board[y + o.y][x + o.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Merge player's piece with the board
    function merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    // Rotate a matrix (piece)
    function rotate(matrix, dir) {
        // Transpose
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }
        
        // Reverse rows or columns based on direction
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }
    
    // Player rotation with collision detection
    function playerRotate(dir) {
        if (paused || gameOver) return;
        
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        
        // Handle collision during rotation
        while (collide(board, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }
    
    // Move player left or right
    function playerMove(dir) {
        if (paused || gameOver) return;
        
        player.pos.x += dir;
        if (collide(board, player)) {
            player.pos.x -= dir;
        }
    }
    
    // Drop player's piece
    function playerDrop() {
        if (paused || gameOver) return;
        
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            merge(board, player);
            playerReset();
            sweepLines();
            updateScore();
        }
        dropCounter = 0;
    }
    
    // Hard drop (instantly drop the piece)
    function playerHardDrop() {
        if (paused || gameOver) return;
        
        while (!collide(board, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(board, player);
        playerReset();
        sweepLines();
        updateScore();
        dropCounter = 0;
    }
    
    // Reset player with a new piece
    function playerReset() {
        // Set the next piece as current or create a new one if none
        player.matrix = player.next || createPiece();
        player.next = createPiece();
        
        // Reset position
        player.pos.y = 0;
        player.pos.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.matrix[0].length / 2);
        
        // Check for game over
        if (collide(board, player)) {
            gameOver = true;
            startButton.textContent = 'Tekrar Başlat';
        }
    }
    
    // Clear completed lines
    function sweepLines() {
        let linesCleared = 0;
        
        outer: for (let y = board.length - 1; y >= 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }
            
            // Remove the line and add an empty line at the top
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            y++;
            
            linesCleared++;
        }
        
        // Update lines count and level
        if (linesCleared > 0) {
            lines += linesCleared;
            linesElement.textContent = lines;
            
            // Level up every 10 lines
            const newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                levelElement.textContent = level;
                // Increase speed with level
                dropInterval = 1000 * Math.pow(0.8, level - 1);
            }
        }
        
        return linesCleared;
    }
    
    // Update score based on lines cleared
    function updateScore() {
        const linesCleared = sweepLines();
        if (linesCleared > 0) {
            // Score calculation based on number of lines cleared and level
            // Using the original Nintendo scoring system
            const points = [0, 40, 100, 300, 1200];
            score += points[linesCleared] * level;
            scoreElement.textContent = score;
        }
    }
    
    // Handle keyboard input
    function handleKeyPress(event) {
        if (gameOver) return;
        
        switch(event.keyCode) {
            case 37: // Left arrow
                playerMove(-1);
                break;
            case 39: // Right arrow
                playerMove(1);
                break;
            case 40: // Down arrow
                playerDrop();
                break;
            case 38: // Up arrow
                playerRotate(1);
                break;
            case 32: // Space
                playerHardDrop();
                break;
            case 80: // P key
                togglePause();
                break;
        }
    }
    
    // Start or restart the game
    function startGame() {
        // Reset game state
        board = createBoard();
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 1000;
        gameOver = false;
        paused = false;
        
        // Update display
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
        pauseButton.textContent = 'Duraklat';
        startButton.textContent = 'Yeniden Başlat';
        
        // Initialize player
        player.next = createPiece();
        playerReset();
        
        // Start game loop if not already running
        if (!lastTime) {
            update();
        }
    }
    
    // Toggle pause state
    function togglePause() {
        if (gameOver) return;
        
        paused = !paused;
        pauseButton.textContent = paused ? 'Devam Et' : 'Duraklat';
    }
    
    // Main game loop
    function update(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;
        
        if (!gameOver) {
            if (!paused) {
                dropCounter += deltaTime;
                if (dropCounter > dropInterval) {
                    playerDrop();
                }
            }
            
            draw();
            requestAnimationFrame(update);
        } else {
            draw(); // Draw final state with game over message
        }
    }
    
    // Initialize the game
    draw();
});
