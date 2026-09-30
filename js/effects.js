/**
 * Floating Sparkles & Gentle Particles Effect
 * Cute, lightweight canvas animation with stars, soft sparkles, and little glowing dots.
 */

class SparkleCanvas {
  constructor(canvasId = "sparkle-canvas") {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.numParticles = 35;
    this.enabled = true;
    this.colors = ["#ff9a9e", "#fecfef", "#a1c4fd", "#c2e9fb", "#fdcbf1", "#ffe259"];
    this.mouseX = -100;
    this.mouseY = -100;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());

    // Gentle cursor tracker for soft interactive ripples
    window.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    this.createParticles();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(this.newParticle());
    }
  }

  newParticle(fromMouse = false) {
    const isStar = Math.random() > 0.45;
    return {
      x: fromMouse ? this.mouseX + (Math.random() - 0.5) * 30 : Math.random() * this.canvas.width,
      y: fromMouse ? this.mouseY + (Math.random() - 0.5) * 30 : Math.random() * this.canvas.height,
      size: Math.random() * 3 + 1.5,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: -Math.random() * 0.6 - 0.2, // Floats gently upwards
      opacity: Math.random() * 0.7 + 0.3,
      fadeSpeed: Math.random() * 0.008 + 0.003,
      growing: Math.random() > 0.5,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      isStar: isStar,
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.03
    };
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius, color, alpha) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = alpha;
    this.ctx.fill();
    this.ctx.restore();
  }

  animate() {
    if (!this.canvas) return;

    if (!this.enabled) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      requestAnimationFrame(() => this.animate());
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      // Opacity oscillation
      if (p.growing) {
        p.opacity += p.fadeSpeed;
        if (p.opacity >= 0.8) p.growing = false;
      } else {
        p.opacity -= p.fadeSpeed;
        if (p.opacity <= 0.1) p.growing = true;
      }

      // Reset when floating off screen
      if (p.y < -10 || p.x < -10 || p.x > this.canvas.width + 10) {
        this.particles[i] = this.newParticle();
        this.particles[i].y = this.canvas.height + 10;
      }

      // Render
      if (p.isStar) {
        this.drawStar(p.x, p.y, 4, p.size * 2, p.size * 0.7, p.color, p.opacity);
      } else {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.opacity;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    requestAnimationFrame(() => this.animate());
  }

  setThemeColors(colors) {
    if (colors && colors.length) {
      this.colors = colors;
    }
  }

  toggle(enabled) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
  }
}

let portfolioSparkles = null;
document.addEventListener("DOMContentLoaded", () => {
  portfolioSparkles = new SparkleCanvas("sparkle-canvas");
});
