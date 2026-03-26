import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

interface ParticleBackgroundProps {
  particleCount?: number;
  interactive?: boolean;
  className?: string;
}

export function ParticleBackground({ 
  particleCount = 150, 
  interactive = true,
  className = ''
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const trailRef = useRef<TrailPoint[]>([]);
  const animationRef = useRef<number>();
  const lastFrameRef = useRef(0);

  const createParticles = useCallback((width: number, height: number, count: number): Particle[] => {
    const particles: Particle[] = [];
    const cols = Math.ceil(Math.sqrt(count * (width / height)));
    const rows = Math.ceil(count / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellWidth + cellWidth / 2 + (Math.random() - 0.5) * cellWidth * 0.8;
      const y = row * cellHeight + cellHeight / 2 + (Math.random() - 0.5) * cellHeight * 0.8;
      
      particles.push({
        x, y, baseX: x, baseY: y,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    return particles;
  }, []);

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isActive = mouseRef.current.active;
    // Throttle to ~15fps when idle, full speed when mouse active
    const minInterval = isActive ? 0 : 66;
    if (timestamp - lastFrameRef.current < minInterval) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameRef.current = timestamp;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains('dark');
    const baseColor = isDark ? '100, 180, 255' : '60, 140, 220';
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    // Update and draw particles
    const particles = particlesRef.current;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Update position
      if (interactive && isActive) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 120) {
          const force = (1 - distance / 120) * 30;
          const angle = Math.atan2(dy, dx);
          const targetX = p.baseX + Math.cos(angle) * force;
          const targetY = p.baseY + Math.sin(angle) * force;
          p.x += (targetX - p.x) * 0.2;
          p.y += (targetY - p.y) * 0.2;
        } else {
          p.x += (p.baseX - p.x) * 0.05;
          p.y += (p.baseY - p.y) * 0.05;
        }
      } else {
        p.x += (p.baseX - p.x) * 0.05;
        p.y += (p.baseY - p.y) * 0.05;
      }

      // Draw particle
      const dx = p.x - mx;
      const dy = p.y - my;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const glowIntensity = isActive ? Math.max(0, 1 - distance / 150) : 0;
      const finalOpacity = p.opacity + glowIntensity * 0.5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseColor}, ${finalOpacity})`;
      ctx.fill();

      if (glowIntensity > 0.3) {
        ctx.shadowColor = isDark ? 'rgba(100, 180, 255, 0.9)' : 'rgba(60, 140, 220, 0.7)';
        ctx.shadowBlur = 8 * glowIntensity;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Trail
    const trail = trailRef.current;
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].age++;
      if (trail[i].age >= 30) {
        trail.splice(i, 1);
      }
    }

    if (trail.length >= 2) {
      for (let i = 1; i < trail.length; i++) {
        const point = trail[i];
        const prevPoint = trail[i - 1];
        const alpha = Math.max(0, 1 - point.age / 30) * 0.8;
        if (alpha <= 0) continue;

        const gradient = ctx.createLinearGradient(prevPoint.x, prevPoint.y, point.x, point.y);
        gradient.addColorStop(0, `rgba(${baseColor}, ${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(${baseColor}, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3 * alpha + 1;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.shadowColor = isDark ? 'rgba(100, 180, 255, 0.8)' : 'rgba(60, 140, 220, 0.6)';
        ctx.shadowBlur = 10 * alpha;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Mouse glow
      if (isActive && trail.length > 0) {
        const lastPoint = trail[trail.length - 1];
        const glowGradient = ctx.createRadialGradient(lastPoint.x, lastPoint.y, 0, lastPoint.x, lastPoint.y, 40);
        const glowColor = isDark ? '100, 180, 255' : '60, 140, 220';
        glowGradient.addColorStop(0, `rgba(${glowColor}, 0.4)`);
        glowGradient.addColorStop(0.5, `rgba(${glowColor}, 0.1)`);
        glowGradient.addColorStop(1, `rgba(${glowColor}, 0)`);
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 40, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
    }

    // Connections only when mouse active (limit checked particles)
    if (isActive) {
      const connectionColor = isDark ? '100, 180, 255' : '60, 140, 220';
      const nearMouse: Particle[] = [];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const d = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        if (d < 150) nearMouse.push(p);
      }
      for (let i = 0; i < nearMouse.length; i++) {
        for (let j = i + 1; j < nearMouse.length; j++) {
          const dist = Math.sqrt((nearMouse[i].x - nearMouse[j].x) ** 2 + (nearMouse[i].y - nearMouse[j].y) ** 2);
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.3;
            ctx.beginPath();
            ctx.moveTo(nearMouse[i].x, nearMouse[i].y);
            ctx.lineTo(nearMouse[j].x, nearMouse[j].y);
            ctx.strokeStyle = `rgba(${connectionColor}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Limit pixel ratio for performance on low-end devices
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      particlesRef.current = createParticles(w, h, particleCount);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [particleCount, createParticles]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { x, y, active: true };
    trailRef.current.push({ x, y, age: 0 });
    if (trailRef.current.length > 50) trailRef.current.shift();
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000, active: false };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ zIndex: 0 }}
    />
  );
}
