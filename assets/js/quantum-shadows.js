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
            // Faster movement across screen
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.5 + 0.2; // Faster movement: 0.2-0.7 px/frame
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.originalVx = this.vx;
            this.originalVy = this.vy;
            this.phase = Math.random() * Math.PI * 2;
            this.amplitude = Math.random() * 0.3 + 0.1;
            this.frequency = Math.random() * 0.02 + 0.01;
            this.life = parentSplit ? Math.random() * 0.3 + 0.4 : 1.0; // Splits start with less life
            this.maxLife = this.life;
            this.decay = 0.9992; // Individual fading
            this.shadowType = Math.floor(Math.random() * 2); // Only 0 or 1 (no standing person)
            this.walkPhase = Math.random() * Math.PI * 2;
            // Walking animation speed (keep this the same)
            this.walkSpeed = 0.025 + Math.random() * 0.015;
            this.isWatching = false;
            this.watchDirection = 0;
            this.fadeInPhase = parentSplit ? Math.PI : 0; // Splits fade in immediately
            this.hasSplit = parentSplit;
            this.splitCooldown = 0;
            this.lastSplitTime = 0;
        }

        update() {
            this.phase += this.frequency;
            this.life *= this.decay;
            this.splitCooldown = Math.max(0, this.splitCooldown - 1);

            // Fade-in effect for new figures
            if (this.fadeInPhase < Math.PI) {
                this.fadeInPhase += 0.05;
            }

            // Mouse interaction - stop and watch instead of swarming
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) { // Within watching range
                this.isWatching = true;
                this.watchDirection = Math.atan2(dy, dx);
                // Stop moving when watching
                this.vx *= 0.95;
                this.vy *= 0.95;
            } else {
                this.isWatching = false;
                // Resume normal movement
                this.vx = this.originalVx * 0.98 + this.vx * 0.02;
                this.vy = this.originalVy * 0.98 + this.vy * 0.02;
            }

            // Only update walk phase if not watching
            if (!this.isWatching) {
                this.walkPhase += this.walkSpeed;
            }

            // More natural walking motion with head bob and subtle sway
            const headBob = this.isWatching ? 0 : Math.sin(this.walkPhase * 2) * 0.15;
            this.x += this.vx + (this.isWatching ? 0 : Math.sin(this.walkPhase) * 0.1);
            this.y += this.vy + headBob;

            // Much less velocity decay for consistent movement
            this.vx *= 0.9995;
            this.vy *= 0.9995;

            return this.life > 0.005; // Individual fade out
        }

        // Splitting mechanic
        split() {
            if (this.splitCooldown > 0 || this.hasSplit || this.life < 0.3) return null;

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
            const fadeIn = Math.sin(this.fadeInPhase) * 0.5 + 0.5;
            const intensity = this.life * (Math.sin(this.phase) * 0.3 + 0.7) * fadeIn;
            const baseAlpha = Math.max(0.3, intensity * 0.6); // Much more visible
            const walkCycle = Math.sin(this.walkPhase);

            ctx.save();
            ctx.translate(this.x, this.y);

            // Create a more visible shadow
            ctx.fillStyle = `rgba(60, 60, 60, ${baseAlpha})`;

            // Draw more realistic human silhouette
            this.drawHumanSilhouette();

            ctx.restore();
        }

        drawHumanSilhouette() {
            const scale = 0.8 + Math.sin(this.phase) * 0.1; // Subtle size variation
            const leftLegSwing = Math.sin(this.walkPhase) * 4;
            const rightLegSwing = Math.sin(this.walkPhase + Math.PI) * 4;
            const leftArmSwing = Math.sin(this.walkPhase + Math.PI) * 2;
            const rightArmSwing = Math.sin(this.walkPhase) * 2;
            const headBob = Math.sin(this.walkPhase * 2) * 1;

            ctx.save();
            ctx.scale(scale, scale);

            // Head - rounded
            ctx.beginPath();
            ctx.ellipse(0, -25 + headBob, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Neck
            ctx.fillRect(-1, -20, 2, 3);

            // Torso - more realistic shape
            ctx.beginPath();
            ctx.ellipse(0, -12, 5, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Arms
            ctx.save();
            ctx.translate(-4, -15);
            ctx.rotate(leftArmSwing * 0.1);
            ctx.fillRect(-1, 0, 2, 12);
            ctx.restore();

            ctx.save();
            ctx.translate(4, -15);
            ctx.rotate(rightArmSwing * 0.1);
            ctx.fillRect(-1, 0, 2, 12);
            ctx.restore();

            // Legs - with knee joints
            // Left leg
            ctx.save();
            ctx.translate(-2, -4);
            ctx.rotate(leftLegSwing * 0.05);
            ctx.fillRect(-1, 0, 2, 10); // Thigh
            ctx.save();
            ctx.translate(0, 10);
            ctx.rotate(leftLegSwing * 0.08);
            ctx.fillRect(-1, 0, 2, 12); // Shin
            // Foot
            ctx.fillRect(-2, 12, 4, 2);
            ctx.restore();
            ctx.restore();

            // Right leg
            ctx.save();
            ctx.translate(2, -4);
            ctx.rotate(rightLegSwing * 0.05);
            ctx.fillRect(-1, 0, 2, 10); // Thigh
            ctx.save();
            ctx.translate(0, 10);
            ctx.rotate(rightLegSwing * 0.08);
            ctx.fillRect(-1, 0, 2, 12); // Shin
            // Foot
            ctx.fillRect(-2, 12, 4, 2);
            ctx.restore();
            ctx.restore();

            ctx.restore();
        }
    }

    function spawnParticles() {
        if (particles.length < 65) { // 30% increase: 50 * 1.3 = 65
            // Random spawn locations: top, sides, bottom
            let spawnSide = Math.random();
            let x, y;

            if (spawnSide < 0.4) {
                // Top edge
                x = Math.random() * canvas.width;
                y = -50;
            } else if (spawnSide < 0.7) {
                // Left edge
                x = -50;
                y = Math.random() * canvas.height;
            } else if (spawnSide < 0.9) {
                // Right edge
                x = canvas.width + 50;
                y = Math.random() * canvas.height;
            } else {
                // Bottom edge
                x = Math.random() * canvas.width;
                y = canvas.height + 50;
            }

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