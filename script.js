/**
 * HEXAGON LOGO SHOWCASE - Advanced Animation Engine
 * High-performance particle systems, lightning effects, and interactive elements
 */

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
    particles: {
        count: 80,
        maxSpeed: 0.5,
        minSize: 1,
        maxSize: 3,
        connectionDistance: 150,
        mouseInteractionRadius: 200
    },
    lightning: {
        enabled: true,
        interval: 4000,
        branches: 3,
        color: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.4)'
    },
    stats: {
        animationDuration: 2000,
        decimalPlaces: {
            'uptime': 1,
            'latency': 1,
            'connections': 0
        }
    }
};

// =====================================================
// PARTICLE SYSTEM
// =====================================================

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.vx = (Math.random() - 0.5) * CONFIG.particles.maxSpeed;
        this.vy = (Math.random() - 0.5) * CONFIG.particles.maxSpeed;
        this.size = CONFIG.particles.minSize + Math.random() * (CONFIG.particles.maxSize - CONFIG.particles.minSize);
        this.opacity = 0.3 + Math.random() * 0.7;
        this.hue = Math.random() > 0.5 ? 50 : 280; // Yellow (50) or Purple (280)
    }

    update(mouseX, mouseY) {
        // Move particle
        this.x += this.vx;
        this.y += this.vy;

        // Mouse interaction
        if (mouseX !== null && mouseY !== null) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.particles.mouseInteractionRadius) {
                const force = (CONFIG.particles.mouseInteractionRadius - dist) / CONFIG.particles.mouseInteractionRadius;
                this.vx -= (dx / dist) * force * 0.02;
                this.vy -= (dy / dist) * force * 0.02;
            }
        }

        // Boundary check with wrap-around
        if (this.x < 0) this.x = this.canvas.width;
        if (this.x > this.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.canvas.height;
        if (this.y > this.canvas.height) this.y = 0;

        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Ensure minimum velocity
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed < 0.1) {
            this.vx += (Math.random() - 0.5) * 0.1;
            this.vy += (Math.random() - 0.5) * 0.1;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.opacity})`;
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 60%, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class ParticleSystem {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = null;
        this.mouseY = null;
        this.animationId = null;

        this.init();
    }

    init() {
        this.canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
        this.container.appendChild(this.canvas);

        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < CONFIG.particles.count; i++) {
            this.particles.push(new Particle(this.canvas));
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            this.mouseX = null;
            this.mouseY = null;
        });
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.particles.connectionDistance) {
                    const opacity = (1 - dist / CONFIG.particles.connectionDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.particles.forEach(particle => {
            particle.update(this.mouseX, this.mouseY);
            particle.draw(this.ctx);
        });

        // Draw connections
        this.drawConnections();

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// =====================================================
// LIGHTNING EFFECT
// =====================================================

class LightningBolt {
    constructor(ctx, startX, startY, endX, endY, options = {}) {
        this.ctx = ctx;
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.options = {
            segments: options.segments || 10,
            spread: options.spread || 50,
            color: options.color || CONFIG.lightning.color,
            glowColor: options.glowColor || CONFIG.lightning.glowColor,
            lineWidth: options.lineWidth || 2,
            branches: options.branches || 0,
            branchProbability: options.branchProbability || 0.3
        };
        this.points = this.generatePoints();
        this.opacity = 1;
        this.fadeSpeed = 0.05;
    }

    generatePoints() {
        const points = [{ x: this.startX, y: this.startY }];
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;

        for (let i = 1; i < this.options.segments; i++) {
            const t = i / this.options.segments;
            const x = this.startX + dx * t + (Math.random() - 0.5) * this.options.spread;
            const y = this.startY + dy * t + (Math.random() - 0.5) * this.options.spread;
            points.push({ x, y });
        }

        points.push({ x: this.endX, y: this.endY });
        return points;
    }

    draw() {
        if (this.opacity <= 0) return false;

        this.ctx.save();
        this.ctx.globalAlpha = this.opacity;

        // Glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.options.glowColor;

        // Draw main bolt
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            this.ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        this.ctx.strokeStyle = this.options.color;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();

        // Draw inner bright core
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = this.options.lineWidth * 0.3;
        this.ctx.stroke();

        this.ctx.restore();

        // Fade out
        this.opacity -= this.fadeSpeed;

        return this.opacity > 0;
    }
}

class LightningSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.bolts = [];
        this.lastBoltTime = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();

        // Periodic lightning
        if (CONFIG.lightning.enabled) {
            this.scheduleLightning();
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createBolt(startX, startY, endX, endY) {
        const mainBolt = new LightningBolt(this.ctx, startX, startY, endX, endY, {
            segments: 12,
            spread: 80,
            lineWidth: 2,
            branches: CONFIG.lightning.branches
        });

        this.bolts.push(mainBolt);

        // Create branches
        for (let i = 0; i < CONFIG.lightning.branches; i++) {
            const branchPoint = mainBolt.points[Math.floor(Math.random() * mainBolt.points.length * 0.7) + 2];
            if (branchPoint) {
                const branchEndX = branchPoint.x + (Math.random() - 0.5) * 200;
                const branchEndY = branchPoint.y + Math.random() * 150;

                const branch = new LightningBolt(this.ctx, branchPoint.x, branchPoint.y, branchEndX, branchEndY, {
                    segments: 6,
                    spread: 30,
                    lineWidth: 1
                });

                this.bolts.push(branch);
            }
        }
    }

    createRandomBolt() {
        const side = Math.floor(Math.random() * 4);
        let startX, startY, endX, endY;

        switch (side) {
            case 0: // Top
                startX = Math.random() * this.canvas.width;
                startY = 0;
                endX = startX + (Math.random() - 0.5) * 400;
                endY = this.canvas.height * (0.3 + Math.random() * 0.5);
                break;
            case 1: // Right
                startX = this.canvas.width;
                startY = Math.random() * this.canvas.height * 0.5;
                endX = this.canvas.width * (0.5 + Math.random() * 0.3);
                endY = startY + Math.random() * 300;
                break;
            case 2: // Left
                startX = 0;
                startY = Math.random() * this.canvas.height * 0.5;
                endX = this.canvas.width * (0.2 + Math.random() * 0.3);
                endY = startY + Math.random() * 300;
                break;
            default: // Corner
                startX = Math.random() > 0.5 ? 0 : this.canvas.width;
                startY = 0;
                endX = this.canvas.width / 2 + (Math.random() - 0.5) * 200;
                endY = this.canvas.height / 2 + (Math.random() - 0.5) * 200;
        }

        this.createBolt(startX, startY, endX, endY);
    }

    scheduleLightning() {
        const randomDelay = CONFIG.lightning.interval + (Math.random() - 0.5) * 2000;

        setTimeout(() => {
            this.createRandomBolt();
            this.scheduleLightning();
        }, randomDelay);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw bolts
        this.bolts = this.bolts.filter(bolt => bolt.draw());

        requestAnimationFrame(() => this.animate());
    }
}

// =====================================================
// COUNTER ANIMATION
// =====================================================

class CounterAnimation {
    constructor() {
        this.counters = document.querySelectorAll('.stat-value');
        this.hasAnimated = false;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.hasAnimated = true;
                    this.animateCounters();
                }
            });
        }, { threshold: 0.5 });

        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            observer.observe(statsSection);
        }
    }

    animateCounters() {
        this.counters.forEach(counter => {
            const target = parseFloat(counter.dataset.target);
            const duration = CONFIG.stats.animationDuration;
            const startTime = performance.now();

            // Determine decimal places based on target value
            const decimals = target < 100 ? 1 : 0;

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (ease-out-expo)
                const easeOutExpo = 1 - Math.pow(2, -10 * progress);
                const currentValue = target * easeOutExpo;

                counter.textContent = this.formatNumber(currentValue, decimals);

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = this.formatNumber(target, decimals);
                }
            };

            requestAnimationFrame(updateCounter);
        });
    }

    formatNumber(num, decimals) {
        if (num >= 1000) {
            return Math.floor(num).toLocaleString();
        }
        return num.toFixed(decimals);
    }
}

// =====================================================
// INTERACTIVE EFFECTS
// =====================================================

class InteractiveEffects {
    constructor() {
        this.init();
    }

    init() {
        this.setupHexagonHover();
        this.setupLetterEffects();
        this.setupMouseTrail();
    }

    setupHexagonHover() {
        const hexFeatures = document.querySelectorAll('.hex-feature');

        hexFeatures.forEach(hex => {
            hex.addEventListener('mouseenter', () => {
                this.createRipple(hex);
            });
        });
    }

    createRipple(element) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 10px;
            height: 10px;
            background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: rippleEffect 0.8s ease-out forwards;
            pointer-events: none;
            z-index: 100;
        `;

        element.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    setupLetterEffects() {
        const letters = document.querySelectorAll('.letter');

        letters.forEach(letter => {
            letter.addEventListener('mouseenter', () => {
                this.glitchEffect(letter);
            });
        });
    }

    glitchEffect(element) {
        const originalText = element.textContent;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let iterations = 0;
        const maxIterations = 10;

        const interval = setInterval(() => {
            if (iterations >= maxIterations) {
                element.textContent = originalText;
                clearInterval(interval);
                return;
            }

            element.textContent = glitchChars[Math.floor(Math.random() * glitchChars.length)];
            iterations++;
        }, 30);

        setTimeout(() => {
            element.textContent = originalText;
            clearInterval(interval);
        }, 300);
    }

    setupMouseTrail() {
        let lastX = 0;
        let lastY = 0;
        let throttle = false;

        document.addEventListener('mousemove', (e) => {
            if (throttle) return;
            throttle = true;

            setTimeout(() => {
                throttle = false;
            }, 50);

            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 20) {
                this.createTrailParticle(e.clientX, e.clientY);
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });
    }

    createTrailParticle(x, y) {
        const particle = document.createElement('div');
        const size = 4 + Math.random() * 4;
        const hue = Math.random() > 0.5 ? 50 : 280; // Yellow or Purple

        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: hsla(${hue}, 100%, 60%, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            box-shadow: 0 0 10px hsla(${hue}, 100%, 60%, 0.5);
            animation: trailFade 0.5s ease-out forwards;
        `;

        document.body.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}

// =====================================================
// ENERGY FLOW ANIMATION
// =====================================================

class EnergyFlow {
    constructor() {
        this.traces = document.querySelectorAll('.trace');
        this.init();
    }

    init() {
        // Add flowing energy effect to traces
        this.traces.forEach((trace, index) => {
            this.addEnergyPulse(trace, index);
        });
    }

    addEnergyPulse(trace, index) {
        setInterval(() => {
            const length = trace.getTotalLength();
            const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

            particle.setAttribute('r', '3');
            particle.setAttribute('fill', '#00f0ff');
            particle.setAttribute('filter', 'url(#neon-glow)');

            // Animate along path
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
            animate.setAttribute('dur', '1s');
            animate.setAttribute('repeatCount', '1');
            animate.setAttribute('fill', 'freeze');

            const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
            mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#trace-path-${index}`);

            animate.appendChild(mpath);
            particle.appendChild(animate);

            // Add to SVG and remove after animation
            const svg = trace.closest('svg');
            if (svg) {
                svg.appendChild(particle);
                setTimeout(() => particle.remove(), 1000);
            }
        }, 3000 + index * 500);
    }
}

// =====================================================
// DYNAMIC CSS INJECTION
// =====================================================

function injectDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleEffect {
            to {
                transform: translate(-50%, -50%) scale(30);
                opacity: 0;
            }
        }

        @keyframes trailFade {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            100% {
                transform: scale(0);
                opacity: 0;
            }
        }

        @keyframes glitch {
            0%, 100% {
                transform: translate(0);
            }
            20% {
                transform: translate(-2px, 2px);
            }
            40% {
                transform: translate(2px, -2px);
            }
            60% {
                transform: translate(-2px, -2px);
            }
            80% {
                transform: translate(2px, 2px);
            }
        }
    `;
    document.head.appendChild(style);
}

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inject dynamic styles
    injectDynamicStyles();

    // Initialize systems
    const particleSystem = new ParticleSystem('particles');
    const lightningSystem = new LightningSystem('lightning-canvas');
    const counterAnimation = new CounterAnimation();
    const interactiveEffects = new InteractiveEffects();

    // Add click-to-lightning effect
    document.addEventListener('click', (e) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        lightningSystem.createBolt(e.clientX, e.clientY, centerX, centerY);
    });

    // Console easter egg
    console.log('%c⬡ HEXAGON SHOWCASE ⬡', 'color: #ffd700; font-size: 24px; font-weight: bold; text-shadow: 0 0 10px #ffd700;');
    console.log('%cPowered by advanced CSS animations & JavaScript particle systems', 'color: #9966ff; font-size: 12px;');
});

// =====================================================
// PERFORMANCE MONITORING
// =====================================================

class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frames = 0;
        this.lastTime = performance.now();

        if (location.hash === '#debug') {
            this.init();
        }
    }

    init() {
        this.createDisplay();
        this.update();
    }

    createDisplay() {
        this.display = document.createElement('div');
        this.display.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00f0ff;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            border: 1px solid #00f0ff;
        `;
        document.body.appendChild(this.display);
    }

    update() {
        this.frames++;
        const currentTime = performance.now();

        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.lastTime = currentTime;
            this.display.textContent = `FPS: ${this.fps}`;
        }

        requestAnimationFrame(() => this.update());
    }
}

// Initialize performance monitor if debug mode
new PerformanceMonitor();
