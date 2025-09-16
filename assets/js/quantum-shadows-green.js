document.addEventListener('DOMContentLoaded', function() {
    let quantumLayer = document.getElementById('quantumShadows');
    if (!quantumLayer) {
        quantumLayer = document.createElement('div');
        quantumLayer.id = 'quantumShadows';
        document.body.appendChild(quantumLayer);
    }

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        mix-blend-mode: normal;
        filter: blur(0.5px);
    `;
    quantumLayer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let mouseX = 0, mouseY = 0;
    let particles = [];
    let wavePhase = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    class ShadowPhoton {
        constructor(x, y, parentSplit = false) {
            this.x = x;
            this.y = y;
            // Faster, more lively movement
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.4 + 0.15; // Faster movement: 0.15-0.55 px/frame
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.originalVx = this.vx;
            this.originalVy = this.vy;
            this.phase = Math.random() * Math.PI * 2;
            this.amplitude = Math.random() * 0.3 + 0.1;
            this.frequency = Math.random() * 0.02 + 0.01;

            // Proper fade-in/fade-out system
            this.age = 0;
            this.maxAge = 300 + Math.random() * 600; // Live for 5-15 seconds (300-900 frames at 60fps)
            this.fadeInDuration = 120; // 120 frames to fade in (2 seconds)
            this.fadeOutDuration = 120; // 120 frames to fade out (2 seconds)

            this.shadowType = Math.floor(Math.random() * 2); // Only 0 or 1 (no standing person)
            this.walkPhase = Math.random() * Math.PI * 2;
            // Walking animation speed (increased proportionately)
            this.walkSpeed = 0.05 + Math.random() * 0.03;
            this.isWatching = false;
            this.watchDirection = 0;
            this.watchStartTime = 0; // When they started watching
            this.watchTimeout = 600; // 10 seconds at 60fps
            this.ignoreMouseUntil = 0; // Immunity from mouse attraction
            this.hasSplit = parentSplit;
            this.splitCooldown = 0;
            this.lastSplitTime = 0;
        }

        update() {
            this.phase += this.frequency;
            this.splitCooldown = Math.max(0, this.splitCooldown - 1);

            // Mouse interaction - gravitate from wide range, stop very close
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const currentTime = Date.now();

            // Check if we should ignore mouse attraction due to recent timeout
            if (currentTime < this.ignoreMouseUntil) {
                // Ignore mouse and continue current movement
                this.isWatching = false;
            } else if (distance < 200) { // Medium gravitational range
                if (distance < 60) { // Very close stopping range
                    if (!this.isWatching) {
                        // Just started watching - record the time
                        this.isWatching = true;
                        this.watchStartTime = Date.now();
                        this.watchDirection = Math.atan2(dy, dx);
                    } else {
                        // Check if we've been watching too long
                        const watchDuration = Date.now() - this.watchStartTime;
                        if (watchDuration > (this.watchTimeout * 16.67)) { // Convert frames to milliseconds (60fps)
                            // Timeout - stop watching and give gentle push away
                            this.isWatching = false;
                            // Give them a gentle push away at normal walking speed
                            const pushStrength = Math.sqrt(this.originalVx * this.originalVx + this.originalVy * this.originalVy);
                            this.vx = -(dx / distance) * pushStrength;
                            this.vy = -(dy / distance) * pushStrength;
                            // Set immunity period - ignore mouse for 5 seconds
                            this.ignoreMouseUntil = currentTime + 5000;
                        } else {
                            // Continue watching and stop movement
                            this.watchDirection = Math.atan2(dy, dx);
                            this.vx *= 0.85;
                            this.vy *= 0.85;
                        }
                    }
                } else {
                    // Gravitate towards mouse when in range but not too close
                    this.isWatching = false;
                    const pullStrength = 0.002; // Gentle gravitational pull
                    this.vx += (dx / distance) * pullStrength;
                    this.vy += (dy / distance) * pullStrength;
                }
            } else {
                this.isWatching = false;
                // Resume normal movement when far away
                this.vx = this.originalVx * 0.98 + this.vx * 0.02;
                this.vy = this.originalVy * 0.98 + this.vy * 0.02;
            }

            // Only age when not watching the mouse (pause fading when standing around)
            if (!this.isWatching) {
                this.age++;
            }

            // Only update walk phase if not watching
            if (!this.isWatching) {
                this.walkPhase += this.walkSpeed;
            }

            // More natural walking motion with head bob and subtle sway
            const headBob = this.isWatching ? 0 : Math.sin(this.walkPhase * 2) * 0.075;
            this.x += this.vx + (this.isWatching ? 0 : Math.sin(this.walkPhase) * 0.1);
            this.y += this.vy + headBob;

            // Much less velocity decay for consistent movement
            this.vx *= 0.9995;
            this.vy *= 0.9995;

            // Return false when figure should be removed (age-based)
            return this.age < this.maxAge;
        }

        // Splitting mechanic
        split() {
            if (this.splitCooldown > 0 || this.hasSplit || this.age < 100) return null;

            this.splitCooldown = 300 + Math.random() * 600; // 5-15 second cooldown
            this.hasSplit = true;

            // Create a new shadow that moves in a slightly different direction
            const splitAngle = Math.atan2(this.vy, this.vx) + (Math.random() - 0.5) * Math.PI * 0.5;
            const newShadow = new ShadowPhoton(this.x + (Math.random() - 0.5) * 20, this.y + (Math.random() - 0.5) * 20, true);
            newShadow.vx = Math.cos(splitAngle) * (0.3 + Math.random() * 0.4);
            newShadow.vy = Math.sin(splitAngle) * (0.3 + Math.random() * 0.4);
            newShadow.originalVx = newShadow.vx;
            newShadow.originalVy = newShadow.vy;

            return newShadow;
        }

        render() {
            // Calculate fade-in/fade-out based on age
            let alpha = 1.0;

            if (this.age < this.fadeInDuration) {
                // Fade in over first fadeInDuration frames - start from 0
                alpha = Math.max(0, this.age / this.fadeInDuration);
            } else if (this.age > this.maxAge - this.fadeOutDuration) {
                // Fade out over last fadeOutDuration frames - end at 0
                const timeLeft = this.maxAge - this.age;
                alpha = Math.max(0, timeLeft / this.fadeOutDuration);
            }

            // Add subtle ghostly flickering
            const flicker = Math.sin(this.phase) * 0.1 + 0.9;
            const baseAlpha = alpha * flicker * 0.7;

            // Don't render if completely transparent
            if (baseAlpha <= 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);

            // Create a lighter header shadow with age-based fading (75% opacity)
            ctx.fillStyle = `rgba(20, 25, 12, ${baseAlpha * 0.60})`;

            // Draw more realistic human silhouette
            this.drawHumanSilhouette();

            ctx.restore();
        }

        drawHumanSilhouette() {
            // When watching, legs should be closed (no swing)
            const leftLegSwing = this.isWatching ? 0 : Math.sin(this.walkPhase) * 2.7;
            const rightLegSwing = this.isWatching ? 0 : Math.sin(this.walkPhase + Math.PI) * 2.7;
            const leftArmSwing = this.isWatching ? 0 : Math.sin(this.walkPhase + Math.PI) * 1.3;
            const rightArmSwing = this.isWatching ? 0 : Math.sin(this.walkPhase) * 1.3;
            const headBob = this.isWatching ? 0 : Math.sin(this.walkPhase * 2) * 0.35;

            ctx.save();

            // Head - rounded (scaled to 2/3)
            ctx.beginPath();
            ctx.ellipse(0, -17 + headBob, 2.7, 3.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Neck (scaled to 2/3)
            ctx.fillRect(-0.7, -13, 1.3, 2);

            // Torso - more realistic shape (scaled to 2/3)
            ctx.beginPath();
            ctx.ellipse(0, -8, 3.3, 5.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Arms (scaled to 2/3)
            ctx.save();
            ctx.translate(-2.7, -10);
            ctx.rotate(leftArmSwing * 0.1);
            ctx.fillRect(-0.7, 0, 1.3, 8);
            ctx.restore();

            ctx.save();
            ctx.translate(2.7, -10);
            ctx.rotate(rightArmSwing * 0.1);
            ctx.fillRect(-0.7, 0, 1.3, 8);
            ctx.restore();

            // Legs - with knee joints (scaled to 2/3)
            // Left leg
            ctx.save();
            ctx.translate(-1.3, -2.7);
            ctx.rotate(leftLegSwing * 0.05);
            ctx.fillRect(-0.7, 0, 1.3, 6.7); // Thigh
            ctx.save();
            ctx.translate(0, 6.7);
            ctx.rotate(leftLegSwing * 0.08);
            ctx.fillRect(-0.7, 0, 1.3, 8); // Shin
            // Foot
            ctx.fillRect(-1.3, 8, 2.7, 1.3);
            ctx.restore();
            ctx.restore();

            // Right leg
            ctx.save();
            ctx.translate(1.3, -2.7);
            ctx.rotate(rightLegSwing * 0.05);
            ctx.fillRect(-0.7, 0, 1.3, 6.7); // Thigh
            ctx.save();
            ctx.translate(0, 6.7);
            ctx.rotate(rightLegSwing * 0.08);
            ctx.fillRect(-0.7, 0, 1.3, 8); // Shin
            // Foot
            ctx.fillRect(-1.3, 8, 2.7, 1.3);
            ctx.restore();
            ctx.restore();

            ctx.restore();
        }
    }

    function spawnParticles() {
        if (particles.length < 75) { // Increased total number for more presence
            // Always spawn randomly across the screen for true fade-in effect
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;

            particles.push(new ShadowPhoton(x, y));
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        wavePhase += 0.02;

        // Update and render particles with splitting
        const newParticles = [];
        particles = particles.filter(particle => {
            // Chance for splitting (rare event)
            if (Math.random() < 0.0008 && particles.length < 45) { // Lower chance, limit total
                const split = particle.split();
                if (split) {
                    newParticles.push(split);
                }
            }

            particle.render();
            return particle.update();
        });

        // Add any new split particles
        particles.push(...newParticles);

        spawnParticles();
        requestAnimationFrame(animate);
    }

    animate();
});