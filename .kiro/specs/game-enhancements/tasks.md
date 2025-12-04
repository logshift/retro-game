# Implementation Plan

- [x] 1. Implement score persistence system
  - Create ScoreManager object with methods to load, save, and update high scores
  - Add local storage integration using 'flappyTaylorsHighScore' key
  - Handle edge cases: empty storage, corrupted data, storage unavailable
  - Update game initialization to load high score on start
  - Update game over logic to save score when game ends
  - Update score increment logic to check and update high score immediately
  - Modify drawGameOver() to display both current score and high score
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create particle system foundation
  - Implement Particle class with properties: x, y, vx, vy, life, maxLife, size, color, type, rotation, rotationSpeed
  - Create ParticleManager object with particles array
  - Implement ParticleManager.update() to update all particles (position, life, rotation)
  - Implement ParticleManager.draw() to render all particles on canvas
  - Add particle removal logic for expired particles (life <= 0)
  - Integrate particle update and draw calls into main game loop
  - Add maximum particle limit (500) to prevent performance issues
  - _Requirements: 2.3, 2.4, 3.4, 3.5, 4.4, 4.5_

- [x] 3. Implement trail and explosion particle effects
  - Create ParticleManager.createTrail() method to spawn trail particles at Kiro's position
  - Add trail particle spawning to game loop (every 2-3 frames during playing state)
  - Configure trail particles: small size, semi-transparent, Kiro brand colors, fade over 30 frames
  - Create ParticleManager.createExplosion() method to generate explosion particles
  - Configure explosion particles: multiple particles (15-20), radiating velocities, gravity affected, bright colors
  - Integrate explosion effect trigger in checkCollisions() when collision detected
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.3_

- [x] 4. Implement sparkle and confetti particle effects
  - Create ParticleManager.createSparkles() method to generate sparkle particles at Kiro's location
  - Configure sparkle particles: multiple particles (8-12), random directions, bright/golden colors, fade over 20 frames
  - Integrate sparkle effect trigger when obstacle.passed becomes true in updateGame()
  - Create ParticleManager.createConfetti() method to generate confetti particles across screen
  - Configure confetti particles: multiple particles (30-40), distributed x-positions, multiple colors, rotation, gravity
  - Add confetti removal logic for particles below screen (y > canvas.height)
  - Integrate confetti trigger when current score exceeds high score
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Polish and test all features
  - Test score persistence across page reloads and multiple game sessions
  - Verify all particle effects trigger at correct times
  - Test performance with many simultaneous particles
  - Adjust particle counts, sizes, and colors for optimal visual appeal
  - Verify high score display on game over screen
  - Test edge cases: first game (no high score), rapid score increases, extended play
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All requirements 1.1-5.5_

- [x] 6. Implement dark mode theme system
  - Add theme toggle button to HTML with appropriate styling
  - Create theme state management (isDarkMode boolean)
  - Implement loadDarkModePreference() to load saved theme from localStorage
  - Implement toggleDarkMode() to switch between themes and save preference
  - Implement updateThemeButton() to update button text/icon based on current theme
  - Define color schemes for light and dark modes (sky, ground, grass, pipe, pipeBorder)
  - Create getColors() function to return current color scheme
  - Update drawGround() to use dynamic colors from getColors()
  - Update drawObstacles() to use dynamic colors from getColors()
  - Update draw() function to use dynamic sky color
  - Add CSS transitions for smooth theme changes (0.3s)
  - Add dark-mode class styling for body and canvas
  - Test theme toggle functionality and persistence
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
