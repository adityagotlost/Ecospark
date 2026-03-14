import { useEffect, useRef } from 'react';
import './Confetti.css';

const COLORS = ['#34d364', '#00e5c4', '#a8ff78', '#ffd700', '#a78bfa', '#60a5fa', '#f9a8d4'];

function randomBetween(a, b) { return Math.random() * (b - a) + a; }

export default function Confetti({ active, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: randomBetween(0.2, 0.8) * canvas.width,
      y: randomBetween(-0.1, 0.3) * canvas.height,
      r: randomBetween(4, 8),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      d: randomBetween(2, 6),        // falling speed
      vx: randomBetween(-2, 2),
      vy: randomBetween(2, 6),
      angle: randomBetween(0, Math.PI * 2),
      spin: randomBetween(-0.1, 0.1),
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }));

    let frame;
    let elapsed = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      elapsed++;
      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / 120);
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        }
        ctx.restore();
        p.x    += p.vx;
        p.y    += p.vy;
        p.angle+= p.spin;
        p.vy   += 0.1; // gravity
      });

      if (elapsed < 150) {
        frame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
      }
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="confetti-canvas" />;
}
