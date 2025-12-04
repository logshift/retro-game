# Design Document: Game Enhancements

## Overview

This design document outlines the implementation approach for adding persistent score tracking and visual particle effects to the Flappy Taylors game. The enhancements will integrate seamlessly with the existing game loop and state management while maintaining performance and visual appeal.

## Architecture

The enhancements will follow a modular architecture:

1. **Score Persistence Module**: Handles reading/writing scores to browser local storage
2. **Particle System**: Manages creation, updating, and rendering of all particle effects
3. **Effect Triggers**: Integration points in the existing game logic to trigger appropriate effects

The particle system will use a unified particle manager that handles different particle types through configuration objects, allowing for efficient rendering and memory management.

## Components and Interfaces

### Score Manager

```javascript
const ScoreManager = {
    highScore: 0,
    
    // Load high score from local storage
    loadHighScore() -> number
    
    // Save high score to local storage
    saveHighScore(score: number) -> void
    
    // Check and update high score if current score is higher
    checkAndUpdateHighScore(currentScore: number) -> boolean
}
```

### Particle System

```javascript
class Particle {
    x: number
    y: number
    vx: number  // velocity x
    vy: number  // velocity y
    life: number  // 0 to 1, decreases over time
    maxLife: number
    size: number
    color: string
    type: string  // 'trail', 'explosion', 'sparkle', 'confetti'
    rotation: number  // for confetti
    rotationSpeed: number  // for confetti
}

const ParticleManager = {
    particles: Particle[]
    
    // Create trail particles
    createTrail(x: number, y: number) -> void
    
    // Create explosion particles
    createExplosion(x: number, y: number) -> void
    
    // Create sparkle particles
    createSparkles(x: number, y: number) -> void
    
    // Create confetti particles
    createConfetti() -> void
    
    // Update all particles
    update() -> void
    
    // Render all particles
    draw(ctx: CanvasRenderingContext2D) -> void
}
```

## Data Models

### High Score Storage

Local storage key: `'flappyTaylorsHighScore'`
- Stored as string representation of number
- Retrieved and parsed as integer
- Default value: 0 if not present

### Particle Object

```javascript
{
    x: number,           // Current x position
    y: number,           // Current y position
    vx: number,          // Velocity in x direction
    vy: number,          // Velocity in y direction
    life: number,        // Current life (0-1)
    maxLife: number,     // Maximum life duration
    size: number,        // Particle size in pixels
    color: string,       // CSS color string
    type: string,        // Particle type identifier
    rotation: number,    // Current rotation (confetti only)
    rotationSpeed: number // Rotation speed (confetti only)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Score Persistence Properties

Property 1: Score storage on game end
*For any* game session with a final score, when the game ends, the score should be stored in local storage and retrievable afterward.
**Validates: Requirements 1.1**

Property 2: High score retrieval on start
*For any* high score value stored in local storage, when the Game System initializes, it should load that exact high score value.
**Validates: Requirements 1.2**

Property 3: High score update when exceeded
*For any* current score that exceeds the stored high score, the Game System should immediately update the high score in local storage to match the current score.
**Validates: Requirements 1.3**

Property 4: Game over screen displays both scores
*For any* game over state, the rendered game over screen should contain both the current score and the high score.
**Validates: Requirements 1.5**

### Particle System Properties

Property 5: Trail particles spawn during movement
*For any* game state where Kiro is moving and the game is playing, trail particles should be continuously created at regular intervals.
**Validates: Requirements 2.1, 2.5**

Property 6: Trail particles positioned at Kiro location
*For any* trail particle created, its initial position should match Kiro's current position at the time of creation.
**Validates: Requirements 2.2**

Property 7: Particles fade over time
*For any* particle in the system, its life value should decrease with each update cycle until it reaches zero.
**Validates: Requirements 2.3, 3.4, 4.4**

Property 8: Dead particles are removed
*For any* particle with life value at or below zero, it should be removed from the particles array.
**Validates: Requirements 2.4, 3.5, 4.5**

Property 9: Explosion created on collision
*For any* collision event (with obstacle or boundary), an explosion effect with multiple particles should be created at the collision location.
**Validates: Requirements 3.1, 3.2**

Property 10: Explosion particles radiate outward
*For any* explosion effect, the generated particles should have velocities pointing in different directions away from the explosion center.
**Validates: Requirements 3.2**

Property 11: Sparkles created on obstacle pass
*For any* obstacle that Kiro successfully passes, sparkle particles should be created at Kiro's location.
**Validates: Requirements 4.1**

Property 12: Sparkle particles have varied directions
*For any* sparkle effect, the generated particles should have velocities in multiple random directions.
**Validates: Requirements 4.2**

Property 13: Confetti triggered on new high score
*For any* score update where the current score exceeds the previous high score, a confetti effect should be triggered.
**Validates: Requirements 5.1**

Property 14: Confetti particles distributed across screen
*For any* confetti effect, the generated particles should have x-positions distributed across the canvas width.
**Validates: Requirements 5.2**

Property 15: Confetti particles have gravity and rotation
*For any* confetti particle, its y-velocity should increase over time (gravity) and its rotation value should change over time.
**Validates: Requirements 5.3**

Property 16: Confetti particles have multiple colors
*For any* confetti effect, the generated particles should include at least three different color values.
**Validates: Requirements 5.4**

Property 17: Off-screen confetti removed
*For any* confetti particle with y-position greater than the canvas height, it should be removed from the particles array.
**Validates: Requirements 5.5**

## Error Handling

### Local Storage Errors

- **Storage Unavailable**: If local storage is not available (private browsing, storage disabled), the game should continue functioning without persistence, defaulting high score to 0
- **Storage Quota Exceeded**: Unlikely for simple score storage, but should fail gracefully
- **Parse Errors**: If stored high score is corrupted, default to 0 and overwrite with valid data

### Particle System Errors

- **Performance Degradation**: Limit maximum number of active particles (e.g., 500) to prevent performance issues
- **Invalid Particle Data**: Validate particle properties before rendering to prevent canvas errors
- **Memory Leaks**: Ensure all particles are properly removed when their life expires

## Testing Strategy

### Unit Testing

We will use standard JavaScript testing practices with manual verification:

1. **Score Persistence Tests**:
   - Test saving score to local storage
   - Test loading score from local storage
   - Test high score update logic
   - Test empty storage initialization

2. **Particle Creation Tests**:
   - Test trail particle spawning
   - Test explosion particle generation
   - Test sparkle particle generation
   - Test confetti particle generation

3. **Particle Lifecycle Tests**:
   - Test particle update logic (position, life, rotation)
   - Test particle removal when life expires
   - Test particle removal when off-screen

### Property-Based Testing

Since this is a browser-based game without a formal testing framework setup, we will implement property-based testing concepts through:

1. **Manual Property Verification**: During development, test with various game states and verify properties hold
2. **Console Logging**: Add temporary logging to verify particle counts, positions, and lifecycle
3. **Visual Inspection**: Verify visual effects appear correctly under different game conditions

For a production environment, we would use a library like `fast-check` for JavaScript property-based testing, but for this MVP we'll focus on thorough manual testing and code review to ensure properties are satisfied.

### Integration Testing

1. **Full Game Flow**: Play complete game sessions and verify all effects trigger correctly
2. **Score Persistence**: Play multiple sessions and verify high scores persist across page reloads
3. **Performance**: Verify game maintains smooth frame rate with all particle effects active
4. **Edge Cases**: Test with rapid score increases, many simultaneous effects, and extended play sessions

## Implementation Notes

### Performance Considerations

- Use object pooling for particles if performance becomes an issue
- Limit particle count per effect type
- Use requestAnimationFrame for smooth animations
- Batch particle rendering operations

### Visual Design

- Trail particles: Small, semi-transparent circles with Kiro's brand colors
- Explosion particles: Bright, varied sizes, radiating outward with gravity
- Sparkle particles: Star-shaped or bright circles, twinkling effect
- Confetti particles: Rectangular shapes, multiple colors, rotating as they fall

### Integration Points

1. **Game Over State**: Add score save call when gameState changes to 'gameOver'
2. **Game Initialization**: Load high score when game starts
3. **Score Update**: Check for high score when score increments
4. **Collision Detection**: Trigger explosion effect in checkCollisions()
5. **Obstacle Passing**: Trigger sparkle effect when obstacle.passed becomes true
6. **Game Loop**: Update and render particles in main game loop
