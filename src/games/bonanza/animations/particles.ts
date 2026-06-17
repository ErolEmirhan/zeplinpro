export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  shape: "circle" | "star" | "rect";
  rotation: number;
  spin: number;
};

export class ParticlePool {
  private particles: Particle[] = [];
  private raf = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  detach() {
    window.removeEventListener("resize", this.resize);
    cancelAnimationFrame(this.raf);
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }

  private resize = () => {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private emit(p: Omit<Particle, "life" | "maxLife"> & { life?: number }) {
    this.particles.push({
      ...p,
      life: p.life ?? 1,
      maxLife: p.life ?? 1,
    });
    if (!this.raf) this.loop();
  }

  burst(x: number, y: number, color: string, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const speed = 2 + Math.random() * 6;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: 2 + Math.random() * 5,
        color,
        gravity: 0.2,
        shape: Math.random() > 0.5 ? "circle" : "rect",
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  confetti(x: number, y: number) {
    const colors = ["#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#fb7185"];
    for (let i = 0; i < 40; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 40,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: -4 - Math.random() * 8,
        size: 3 + Math.random() * 5,
        color: colors[i % colors.length],
        gravity: 0.12,
        shape: "rect",
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.25,
        life: 0.8 + Math.random() * 0.5,
      });
    }
  }

  sparkles(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      this.emit({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 1 + Math.random() * 2,
        color: "#fef08a",
        gravity: 0,
        shape: "star",
        rotation: 0,
        spin: 0,
        life: 0.4 + Math.random() * 0.3,
      });
    }
  }

  private loop = () => {
    const ctx = this.ctx;
    const canvas = this.canvas;
    if (!ctx || !canvas) return;

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    this.particles = this.particles.filter((p) => {
      p.life -= 0.016;
      if (p.life <= 0) return false;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "star") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      return true;
    });

    ctx.globalAlpha = 1;
    if (this.particles.length > 0) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      this.raf = 0;
    }
  };
}

export const particlePool = new ParticlePool();
