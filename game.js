// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dark Mode Management
let isDarkMode = false;

// Load dark mode preference from localStorage
function loadDarkModePreference() {
    const savedMode = localStorage.getItem('flappyTaylorsDarkMode');
    if (savedMode === 'true') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        updateThemeButton();
    }
}

// Toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('flappyTaylorsDarkMode', isDarkMode);
    updateThemeButton();
}

// Update theme button text
function updateThemeButton() {
    const button = document.getElementById('themeToggle');
    if (button) {
        button.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}

// Color schemes for light and dark modes
const colorSchemes = {
    light: {
        sky: '#87CEEB',
        ground: '#8B4513',
        grass: '#228B22',
        pipe: '#663399',
        pipeBorder: '#8B5FBF'
    },
    dark: {
        sky: '#1a1a2e',
        ground: '#2d2d44',
        grass: '#1a4d2e',
        pipe: '#4a4a6a',
        pipeBorder: '#6a6a8a'
    }
};

// Get current color scheme
function getColors() {
    return isDarkMode ? colorSchemes.dark : colorSchemes.light;
}

// Initialize dark mode on load
loadDarkModePreference();

// Game state
let gameState = 'start'; // 'start', 'playing', 'enterName', 'gameOver'
let score = 0;
let frameCount = 0;

// Score Manager - handles persistent high score storage and leaderboard
const ScoreManager = {
    highScore: 0,
    storageKey: 'flappyTaylorsHighScore',
    leaderboard: [],
    leaderboardKey: 'flappyTaylorsLeaderboard',
    
    // Load high score from local storage
    loadHighScore() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored === null || stored === undefined) {
                // Empty storage - initialize to 0
                this.highScore = 0;
                return 0;
            }
            
            const parsed = parseInt(stored, 10);
            if (isNaN(parsed) || parsed < 0) {
                // Corrupted data - default to 0
                this.highScore = 0;
                this.saveHighScore(0);
                return 0;
            }
            
            this.highScore = parsed;
            return parsed;
        } catch (e) {
            // Storage unavailable (private browsing, etc.) - default to 0
            console.warn('Local storage unavailable:', e);
            this.highScore = 0;
            return 0;
        }
    },
    
    // Save high score to local storage
    saveHighScore(score) {
        try {
            localStorage.setItem(this.storageKey, score.toString());
            this.highScore = score;
        } catch (e) {
            // Storage unavailable or quota exceeded - fail gracefully
            console.warn('Failed to save high score:', e);
        }
    },
    
    // Check and update high score if current score is higher
    checkAndUpdateHighScore(currentScore) {
        if (currentScore > this.highScore) {
            this.saveHighScore(currentScore);
            return true; // New high score achieved
        }
        return false;
    },
    
    // Load leaderboard from local storage
    loadLeaderboard() {
        try {
            const stored = localStorage.getItem(this.leaderboardKey);
            if (stored === null || stored === undefined) {
                // Empty storage - initialize to empty array
                this.leaderboard = [];
                return [];
            }
            
            const parsed = JSON.parse(stored);
            
            // Validate that parsed data is an array
            if (!Array.isArray(parsed)) {
                console.warn('Corrupted leaderboard data: not an array');
                this.leaderboard = [];
                this.saveLeaderboard();
                return [];
            }
            
            // Validate and filter entries
            const validEntries = parsed.filter(entry => {
                // Check if entry has required properties and valid types
                return entry && 
                       typeof entry === 'object' &&
                       typeof entry.name === 'string' &&
                       typeof entry.score === 'number' &&
                       !isNaN(entry.score) &&
                       entry.score >= 0;
            });
            
            this.leaderboard = validEntries;
            return validEntries;
        } catch (e) {
            // Storage unavailable or JSON parse error - default to empty array
            console.warn('Failed to load leaderboard:', e);
            this.leaderboard = [];
            return [];
        }
    },
    
    // Save leaderboard to local storage
    saveLeaderboard() {
        try {
            const jsonString = JSON.stringify(this.leaderboard);
            localStorage.setItem(this.leaderboardKey, jsonString);
        } catch (e) {
            // Storage unavailable or quota exceeded - fail gracefully
            console.warn('Failed to save leaderboard:', e);
        }
    },
    
    // Check if score qualifies for top 10
    isTopTenScore(score) {
        // If leaderboard has less than 10 entries, score qualifies
        if (this.leaderboard.length < 10) {
            return true;
        }
        
        // Check if score is higher than the lowest score in top 10
        const lowestScore = this.leaderboard[this.leaderboard.length - 1].score;
        return score > lowestScore;
    },
    
    // Add score to leaderboard with player name
    addToLeaderboard(score, name) {
        // Validate and sanitize name
        let sanitizedName = name;
        
        // Trim whitespace
        if (typeof sanitizedName === 'string') {
            sanitizedName = sanitizedName.trim();
        }
        
        // Default to "Anonymous" if empty
        if (!sanitizedName || sanitizedName === '') {
            sanitizedName = 'Anonymous';
        }
        
        // Limit to 20 characters
        if (sanitizedName.length > 20) {
            sanitizedName = sanitizedName.substring(0, 20);
        }
        
        // Create new entry
        const newEntry = {
            name: sanitizedName,
            score: score
        };
        
        // Add to leaderboard
        this.leaderboard.push(newEntry);
        
        // Sort by score descending (highest to lowest)
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        if (this.leaderboard.length > 10) {
            this.leaderboard = this.leaderboard.slice(0, 10);
        }
        
        // Save to local storage
        this.saveLeaderboard();
    }
};

// Initialize high score and leaderboard on game load
ScoreManager.loadHighScore();
ScoreManager.loadLeaderboard();

// Particle System
class Particle {
    constructor(x, y, vx, vy, life, size, color, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.type = type;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }
}

const ParticleManager = {
    particles: [],
    maxParticles: 500,
    
    // Create trail particles
    createTrail(x, y) {
        // Kiro brand colors (purple shades) - optimized for visual appeal
        const colors = ['#663399', '#8B5FBF', '#9370DB', '#BA55D3'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Small, semi-transparent particles that fade over 30 frames
        const particle = new Particle(
            x + 25, // Center of Kiro
            y + 30, // Center of Kiro
            -1.5 - Math.random() * 0.5, // Move backward (left) with slight variation
            (Math.random() - 0.5) * 0.5, // Small random y velocity for slight spread
            30, // Life in frames (will fade over 30 frames)
            2.5 + Math.random() * 2, // Small size (2.5-4.5 pixels) - slightly smaller for smoother trail
            color,
            'trail'
        );
        
        this.particles.push(particle);
    },
    
    // Create explosion particles
    createExplosion(x, y) {
        // Generate 18-22 particles for more dramatic effect
        const particleCount = 18 + Math.floor(Math.random() * 5);
        
        // Bright, high-contrast colors for explosion
        const colors = ['#FF4136', '#FF851B', '#FFDC00', '#FF6B6B', '#FFA500', '#FF0000'];
        
        for (let i = 0; i < particleCount; i++) {
            // Random angle for radiating effect with more variation
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.6;
            const speed = 2.5 + Math.random() * 3.5;
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = new Particle(
                x + 25, // Center of Kiro
                y + 30, // Center of Kiro
                Math.cos(angle) * speed, // Radiating x velocity
                Math.sin(angle) * speed, // Radiating y velocity
                45, // Life in frames - slightly longer for better visibility
                1.5 + Math.random() * 2.5, // Size (1.5-4 pixels) - smaller, subtler explosion
                color,
                'explosion'
            );
            
            this.particles.push(particle);
        }
    },
    
    // Create sparkle particles
    createSparkles(x, y) {
        // Generate 10-14 particles for more celebratory effect
        const particleCount = 10 + Math.floor(Math.random() * 5);
        
        // Bright, celebratory colors for sparkles
        const colors = ['#FFFFFF', '#FFFF00', '#FFD700', '#FF69B4', '#00FF00', '#00FFFF'];
        
        for (let i = 0; i < particleCount; i++) {
            // Random angle for varied directions
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2.5;
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = new Particle(
                x + 25, // Center of Kiro
                y + 30, // Center of Kiro
                Math.cos(angle) * speed, // Random x velocity
                Math.sin(angle) * speed, // Random y velocity
                25, // Life in frames (fade over 25 frames) - slightly longer
                2.5 + Math.random() * 2, // Size (2.5-4.5 pixels) - smaller for subtler effect
                color,
                'sparkle'
            );
            
            this.particles.push(particle);
        }
    },
    
    // Create confetti particles
    createConfetti() {
        // Generate 35-45 particles for more celebratory effect
        const particleCount = 35 + Math.floor(Math.random() * 11);
        
        // Vibrant, celebratory colors for confetti
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#FF1493', '#00FF7F'];
        
        for (let i = 0; i < particleCount; i++) {
            // Distributed x-positions across screen
            const x = Math.random() * canvas.width;
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = new Particle(
                x,
                -10 - Math.random() * 20, // Start above screen with variation
                (Math.random() - 0.5) * 3, // Horizontal drift with more variation
                Math.random() * 2 + 0.5, // Initial downward velocity
                120, // Life in frames (longer life for confetti to fall gracefully)
                5 + Math.random() * 5, // Size (5-10 pixels) - varied sizes
                color,
                'confetti'
            );
            
            // Add rotation for confetti with more variation
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.25;
            
            this.particles.push(particle);
        }
    },
    
    // Update all particles
    update() {
        // Update each particle
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Apply gravity to explosion and confetti particles
            if (p.type === 'explosion') {
                p.vy += 0.15; // Gravity effect
            }
            
            if (p.type === 'confetti') {
                p.vy += 0.1; // Gravity effect for confetti
            }
            
            // Update life (decrease over time)
            p.life -= 1 / p.maxLife;
            
            // Update rotation (for confetti)
            if (p.type === 'confetti') {
                p.rotation += p.rotationSpeed;
            }
        }
        
        // Remove expired particles (life <= 0) and off-screen confetti
        this.particles = this.particles.filter(p => {
            // Remove if life expired
            if (p.life <= 0) return false;
            
            // Remove confetti that fell below screen
            if (p.type === 'confetti' && p.y > canvas.height) return false;
            
            return true;
        });
        
        // Enforce maximum particle limit
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(this.particles.length - this.maxParticles);
        }
    },
    
    // Render all particles
    draw(ctx) {
        for (let p of this.particles) {
            ctx.save();
            
            // Set opacity based on life
            ctx.globalAlpha = p.life;
            
            // Handle rotation for confetti
            if (p.type === 'confetti' && p.rotation !== 0) {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.type === 'sparkle') {
                // Draw sparkles as lightning/firework lines
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                
                // Draw a star burst pattern with 4 lines
                const lineLength = p.size * 2;
                
                // Horizontal line
                ctx.beginPath();
                ctx.moveTo(p.x - lineLength, p.y);
                ctx.lineTo(p.x + lineLength, p.y);
                ctx.stroke();
                
                // Vertical line
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - lineLength);
                ctx.lineTo(p.x, p.y + lineLength);
                ctx.stroke();
                
                // Diagonal line 1
                ctx.beginPath();
                ctx.moveTo(p.x - lineLength * 0.7, p.y - lineLength * 0.7);
                ctx.lineTo(p.x + lineLength * 0.7, p.y + lineLength * 0.7);
                ctx.stroke();
                
                // Diagonal line 2
                ctx.beginPath();
                ctx.moveTo(p.x - lineLength * 0.7, p.y + lineLength * 0.7);
                ctx.lineTo(p.x + lineLength * 0.7, p.y - lineLength * 0.7);
                ctx.stroke();
            } else {
                // Draw as circle for other particle types
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
};

// Kiro character
const kiro = {
    x: 80,
    y: canvas.height / 2,
    width: 50,
    height: 60,
    velocity: 0,
    gravity: 0.2,
    jumpPower: -4.5,
    image: new Image()
};

kiro.image.src = 'kiro-logo.png';

// Chore labels for pipes
const chores = [
    'Laundry',
    'Make Lunch',
    'Rake Leaves',
    'Take Out Trash',
    'Wash Dishes',
    'Clean Room',
    'Vacuum',
    'Water Plants'
];

// Track recent chores to avoid repetition
let recentChores = [];

// Obstacles (pipes)
const obstacles = [];
const obstacleWidth = 60;
const obstacleGap = 220;
const obstacleSpeed = 1.5;
const spawnInterval = 180; // frames

// Input handling
let spacePressed = false;

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!spacePressed) {
            spacePressed = true;
            handleInput();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        spacePressed = false;
    }
});

canvas.addEventListener('click', () => {
    handleInput();
});

function handleInput() {
    if (gameState === 'start') {
        gameState = 'playing';
        kiro.velocity = kiro.jumpPower;
    } else if (gameState === 'playing') {
        kiro.velocity = kiro.jumpPower;
    } else if (gameState === 'enterName') {
        // Do nothing - name entry is handled by modal
    } else if (gameState === 'gameOver') {
        restartGame();
    }
}

function restartGame() {
    gameState = 'start';
    score = 0;
    frameCount = 0;
    kiro.y = canvas.height / 2;
    kiro.velocity = 0;
    obstacles.length = 0;
    recentChores = [];
}

function createObstacle() {
    const minHeight = 80;
    const maxHeight = canvas.height - obstacleGap - minHeight - 100;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    // Get available chores (not in recent 4)
    let availableChores = chores.filter(chore => !recentChores.includes(chore));
    
    // If all chores have been used recently, reset
    if (availableChores.length === 0) {
        availableChores = [...chores];
    }
    
    const chore = availableChores[Math.floor(Math.random() * availableChores.length)];
    
    // Add to recent chores and keep only last 4
    recentChores.push(chore);
    if (recentChores.length > 4) {
        recentChores.shift();
    }
    
    obstacles.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + obstacleGap,
        bottomHeight: canvas.height - (topHeight + obstacleGap) - 100,
        passed: false,
        chore: chore
    });
}

function updateGame() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Update Kiro
    kiro.velocity += kiro.gravity;
    kiro.y += kiro.velocity;
    
    // Spawn trail particles every 2-3 frames
    if (frameCount % 3 === 0) {
        ParticleManager.createTrail(kiro.x, kiro.y);
    }
    
    // Spawn obstacles
    if (frameCount % spawnInterval === 0) {
        createObstacle();
    }
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacleSpeed;
        
        // Check if passed
        if (!obstacles[i].passed && obstacles[i].x + obstacleWidth < kiro.x) {
            obstacles[i].passed = true;
            score++;
            
            // Create sparkle effect when obstacle is passed
            ParticleManager.createSparkles(kiro.x, kiro.y);
            
            // Check and update high score immediately when score increases
            const isNewHighScore = ScoreManager.checkAndUpdateHighScore(score);
            
            // Trigger confetti when new high score is achieved
            if (isNewHighScore) {
                ParticleManager.createConfetti();
            }
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacleWidth < 0) {
            obstacles.splice(i, 1);
        }
    }
    
    // Update particles
    ParticleManager.update();
    
    // Check collisions
    checkCollisions();
}

function checkCollisions() {
    // Ground and ceiling collision
    if (kiro.y + kiro.height > canvas.height - 100 || kiro.y < 0) {
        // Create explosion effect at collision location
        ParticleManager.createExplosion(kiro.x, kiro.y);
        handleGameOver();
        return;
    }
    
    // Pipe collision
    for (let obstacle of obstacles) {
        if (kiro.x + kiro.width > obstacle.x && 
            kiro.x < obstacle.x + obstacleWidth) {
            
            // Check if hit top or bottom pipe
            if (kiro.y < obstacle.topHeight || 
                kiro.y + kiro.height > obstacle.bottomY) {
                // Create explosion effect at collision location
                ParticleManager.createExplosion(kiro.x, kiro.y);
                handleGameOver();
                return;
            }
        }
    }
}

function handleGameOver() {
    // Save high score
    ScoreManager.saveHighScore(ScoreManager.highScore);
    
    // Check if score qualifies for top 10
    if (ScoreManager.isTopTenScore(score)) {
        gameState = 'enterName';
        showNameEntryModal();
    } else {
        gameState = 'gameOver';
    }
}

function drawGround() {
    const colors = getColors();
    
    // Ground
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Grass on top
    ctx.fillStyle = colors.grass;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 20);
}

function drawKiro() {
    ctx.save();
    
    // Rotate based on velocity for effect
    const rotation = Math.min(Math.max(kiro.velocity * 0.05, -0.5), 0.5);
    ctx.translate(kiro.x + kiro.width / 2, kiro.y + kiro.height / 2);
    ctx.rotate(rotation);
    
    ctx.drawImage(kiro.image, -kiro.width / 2, -kiro.height / 2, kiro.width, kiro.height);
    
    ctx.restore();
}

function drawObstacles() {
    const colors = getColors();
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    
    for (let obstacle of obstacles) {
        // Top pipe
        ctx.fillStyle = colors.pipe;
        ctx.fillRect(obstacle.x, 0, obstacleWidth, obstacle.topHeight);
        
        // Top pipe border
        ctx.strokeStyle = colors.pipeBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(obstacle.x, 0, obstacleWidth, obstacle.topHeight);
        
        // Top pipe cap
        ctx.fillStyle = colors.pipeBorder;
        ctx.fillRect(obstacle.x - 5, obstacle.topHeight - 20, obstacleWidth + 10, 20);
        
        // Bottom pipe
        ctx.fillStyle = colors.pipe;
        ctx.fillRect(obstacle.x, obstacle.bottomY, obstacleWidth, obstacle.bottomHeight);
        
        // Bottom pipe border
        ctx.strokeStyle = colors.pipeBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(obstacle.x, obstacle.bottomY, obstacleWidth, obstacle.bottomHeight);
        
        // Bottom pipe cap
        ctx.fillStyle = colors.pipeBorder;
        ctx.fillRect(obstacle.x - 5, obstacle.bottomY, obstacleWidth + 10, 20);
        
        // Draw chore label
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.lineWidth = 3;
        
        const labelY = obstacle.topHeight + obstacleGap / 2;
        ctx.strokeText(obstacle.chore, obstacle.x + obstacleWidth / 2, labelY);
        ctx.fillText(obstacle.chore, obstacle.x + obstacleWidth / 2, labelY);
    }
}

function drawScore() {
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'left';
    
    const scoreText = `$${score}`;
    ctx.strokeText(scoreText, 20, 50);
    ctx.fillText(scoreText, 20, 50);
    
    // Allowance label
    ctx.font = 'bold 16px Arial';
    ctx.strokeText('Allowance', 20, 70);
    ctx.fillText('Allowance', 20, 70);
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    
    ctx.strokeText('Flappy Taylors', canvas.width / 2, 150);
    ctx.fillText('Flappy Taylors', canvas.width / 2, 150);
    
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeText('Chore Challenge!', canvas.width / 2, 190);
    ctx.fillText('Chore Challenge!', canvas.width / 2, 190);
    
    ctx.font = '18px Arial';
    ctx.strokeText('Complete chores to earn', canvas.width / 2, 280);
    ctx.fillText('Complete chores to earn', canvas.width / 2, 280);
    
    ctx.strokeText('your allowance!', canvas.width / 2, 310);
    ctx.fillText('your allowance!', canvas.width / 2, 310);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.strokeText('Press SPACE or click to start!', canvas.width / 2, 400);
    ctx.fillText('Press SPACE or click to start!', canvas.width / 2, 400);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#FF4136';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    
    ctx.strokeText('Game Over!', canvas.width / 2, 150);
    ctx.fillText('Game Over!', canvas.width / 2, 150);
    
    // Display current score
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.strokeText(`Allowance: $${score}`, canvas.width / 2, 240);
    ctx.fillText(`Allowance: $${score}`, canvas.width / 2, 240);
    
    // Display high score
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeText(`Best: $${ScoreManager.highScore}`, canvas.width / 2, 290);
    ctx.fillText(`Best: $${ScoreManager.highScore}`, canvas.width / 2, 290);
    
    // Show "NEW HIGH SCORE!" message if applicable
    if (score === ScoreManager.highScore && score > 0) {
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#00FF00';
        ctx.strokeText('NEW HIGH SCORE!', canvas.width / 2, 340);
        ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, 340);
    }
    
    // Update HTML leaderboard display
    updateLeaderboardDisplay();
    
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeText('Press SPACE or click to restart', canvas.width / 2, 420);
    ctx.fillText('Press SPACE or click to restart', canvas.width / 2, 420);
}

function updateLeaderboardDisplay() {
    // Update the HTML leaderboard display
    const leaderboardContent = document.getElementById('leaderboardContent');
    
    if (!leaderboardContent) return;
    
    // Handle empty leaderboard
    if (ScoreManager.leaderboard.length === 0) {
        leaderboardContent.innerHTML = '<div class="leaderboard-empty">No scores yet!</div>';
        return;
    }
    
    // Find if current player just made the leaderboard
    let currentPlayerIndex = -1;
    for (let i = 0; i < ScoreManager.leaderboard.length; i++) {
        if (ScoreManager.leaderboard[i].score === score) {
            // Check if this is likely the current player's entry (most recent with this score)
            currentPlayerIndex = i;
            break;
        }
    }
    
    // Build leaderboard HTML
    let html = '';
    for (let i = 0; i < ScoreManager.leaderboard.length; i++) {
        const entry = ScoreManager.leaderboard[i];
        const isCurrentPlayer = (i === currentPlayerIndex);
        const entryClass = isCurrentPlayer ? 'leaderboard-entry current-player' : 'leaderboard-entry';
        
        html += `
            <div class="${entryClass}">
                <span class="leaderboard-rank">${i + 1}.</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${entry.score}</span>
            </div>
        `;
    }
    
    leaderboardContent.innerHTML = html;
}

function draw() {
    const colors = getColors();
    
    // Clear canvas with theme-appropriate sky color
    ctx.fillStyle = colors.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    drawGround();
    
    // Draw obstacles
    drawObstacles();
    
    // Draw particles
    ParticleManager.draw(ctx);
    
    // Draw Kiro
    drawKiro();
    
    // Draw score
    if (gameState === 'playing' || gameState === 'gameOver') {
        drawScore();
    }
    
    // Draw UI overlays
    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'gameOver') {
        drawGameOver();
    }
}

function drawNameEntry() {
    // This function is not needed as we're using HTML modal
    // But we keep the game rendering in the background
}

function showNameEntryModal() {
    const modal = document.getElementById('nameEntryModal');
    const input = document.getElementById('playerNameInput');
    
    if (modal && input) {
        modal.classList.add('active');
        input.value = '';
        input.focus();
    }
}

function hideNameEntryModal() {
    const modal = document.getElementById('nameEntryModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function submitPlayerName() {
    const input = document.getElementById('playerNameInput');
    if (!input) return;
    
    const playerName = input.value.trim();
    
    // Add score to leaderboard (will handle empty name with "Anonymous")
    ScoreManager.addToLeaderboard(score, playerName);
    
    // Update leaderboard display
    updateLeaderboardDisplay();
    
    // Clear input field
    input.value = '';
    
    // Hide modal
    hideNameEntryModal();
    
    // Transition to game over state
    gameState = 'gameOver';
}

// Event listener for submit button
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitNameButton');
    if (submitButton) {
        submitButton.addEventListener('click', submitPlayerName);
    }
    
    // Event listener for Enter key in name input
    const nameInput = document.getElementById('playerNameInput');
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitPlayerName();
            }
        });
    }
});

function gameLoop() {
    updateGame();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize leaderboard display
updateLeaderboardDisplay();

// Start the game loop
gameLoop();
