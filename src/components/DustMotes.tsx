import React, { useEffect, useRef } from 'react';
import { LampWarmth } from '../types/card';

interface DustMotesProps {
  litCount: number;
  totalCount: number;
  lampWarmth: LampWarmth;
  enabled?: boolean;
  revealTrigger?: number; // Increments or updates on each card reveal
  revealCoords?: { x: number; y: number } | null; // Optional origin of the air displacement
}

interface Particle {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  vx: number;
  vy: number;
  // Air burst velocities for dynamic shockwave and acceleration
  burstVx: number;
  burstVy: number;
  phase: number;
  phaseSpeed: number;
  swayAmplitude: number;
  swaySpeed: number;
}

export const DustMotes: React.FC<DustMotesProps> = ({
  litCount,
  totalCount,
  lampWarmth,
  enabled = true,
  revealTrigger = 0,
  revealCoords = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevTriggerRef = useRef<number>(revealTrigger);
  const lampWarmthRef = useRef<LampWarmth>(lampWarmth);
  lampWarmthRef.current = lampWarmth;

  // Pick particle color according to lamp warmth
  const getParticleColor = (warmth: LampWarmth) => {
    switch (warmth) {
      case 'warm-amber':
        return { r: 245, g: 158, b: 11 };
      case 'golden-vintage':
        return { r: 250, g: 204, b: 21 };
      case 'candle-glow':
        return { r: 249, g: 115, b: 22 };
      case 'daylight':
        return { r: 254, g: 240, b: 138 };
    }
  };

  // Trigger air burst acceleration when a card is revealed
  useEffect(() => {
    if (revealTrigger === 0 || revealTrigger === prevTriggerRef.current) return;
    prevTriggerRef.current = revealTrigger;

    const particles = particlesRef.current;
    if (!particles.length) return;

    const originX = revealCoords ? revealCoords.x : window.innerWidth / 2;
    const originY = revealCoords ? revealCoords.y : window.innerHeight / 2;

    // Apply sudden radial air displacement whoosh & turbulence
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - originX;
      const dy = p.y - originY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Distance falloff: particles closer to the flipped card receive a stronger gust
      const force = Math.max(1.8, Math.min(8.5, 1400 / (dist + 120)));
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.7; // slight vortex angle

      // Burst velocity: outwards and slightly upwards like thermal updraft from warm lamp bulb
      p.burstVx += Math.cos(angle) * force * (Math.random() * 0.6 + 0.7);
      p.burstVy += Math.sin(angle) * force * (Math.random() * 0.6 + 0.7) - 1.5;

      // Brighten particles during the air displacement shockwave
      p.alpha = Math.min(1, p.baseAlpha * 2.2);
    }
  }, [revealTrigger, revealCoords]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Number of dust particles scales up nicely when lamps are lit
    const particleCount = Math.floor(Math.min(105, 38 + (litCount / Math.max(totalCount, 1)) * 65));

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.4 + 0.6,
        baseAlpha: Math.random() * 0.45 + 0.18,
        alpha: Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -Math.random() * 0.38 - 0.08, // Slow gentle upward thermal drift
        burstVx: 0,
        burstVy: 0,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.02 + 0.008,
        swayAmplitude: Math.random() * 0.9 + 0.3,
        swaySpeed: Math.random() * 0.015 + 0.005,
      });
    }

    particlesRef.current = particles;

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 1;

      const color = getParticleColor(lampWarmthRef.current);
      // Brightness multiplier based on how many lamps are lit
      const lightMultiplier = Math.min(1.5, 0.45 + (litCount / Math.max(totalCount, 1)) * 0.95);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Smoothly decay burst air velocities with realistic atmospheric friction
        p.burstVx *= 0.935;
        p.burstVy *= 0.935;

        // If burst speed is negligible, zero it out
        if (Math.abs(p.burstVx) < 0.01) p.burstVx = 0;
        if (Math.abs(p.burstVy) < 0.01) p.burstVy = 0;

        // Update positions with sinusoidal gentle air turbulence + active burst
        p.phase += p.phaseSpeed;
        const sway = Math.sin(time * p.swaySpeed + p.phase) * p.swayAmplitude;

        p.x += p.vx + sway * 0.25 + p.burstVx;
        p.y += p.vy + p.burstVy;

        // Wrap around screen edges smoothly
        if (p.y < -15) {
          p.y = height + 10;
          p.x = Math.random() * width;
        } else if (p.y > height + 15) {
          p.y = -10;
          p.x = Math.random() * width;
        }

        if (p.x < -15) p.x = width + 10;
        else if (p.x > width + 15) p.x = -10;

        // Gentle glimmer / twinkle simulation as particle turns in the light beam
        const twinkle = 0.5 + 0.5 * Math.sin(p.phase);
        const burstGlow = Math.min(0.6, Math.sqrt(p.burstVx * p.burstVx + p.burstVy * p.burstVy) * 0.12);
        const currentAlpha = Math.min(1, (p.baseAlpha * twinkle + burstGlow) * lightMultiplier);

        // Draw soft glowing mote with radiant gradient
        const radius = p.size;
        const glowRadius = radius * (2.6 + burstGlow * 1.5);
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowRadius
        );

        gradient.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha * 0.95})`);
        gradient.addColorStop(0.35, `rgba(${color.r}, ${color.g}, ${color.b}, ${currentAlpha * 0.8})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Tiny intense core that sparks brighter during air acceleration
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * (0.65 + burstGlow * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 250, 230, ${Math.min(1, currentAlpha * 1.35)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [litCount, totalCount, enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full mix-blend-screen opacity-90 transition-opacity duration-1000"
    />
  );
};
