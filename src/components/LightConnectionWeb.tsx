import React, { useEffect, useState, useRef } from 'react';
import { LampWarmth } from '../types/card';

interface LightConnectionWebProps {
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  litCardIds: string[];
  lampWarmth: LampWarmth;
  isVisible?: boolean;
}

interface Point {
  id: string;
  x: number;
  y: number;
}

interface ConnectionLine {
  id: string;
  from: Point;
  to: Point;
  distance: number;
  midX: number;
  midY: number;
  curveOffsetX: number;
  curveOffsetY: number;
}

export const LightConnectionWeb: React.FC<LightConnectionWebProps> = ({
  gridContainerRef,
  litCardIds,
  lampWarmth,
  isVisible = true,
}) => {
  const [lines, setLines] = useState<ConnectionLine[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Calculate coordinates of all lit cards relative to the grid container
  const updatePositions = () => {
    const container = gridContainerRef.current;
    if (!container || litCardIds.length < 2) {
      setLines([]);
      setPoints([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const width = container.scrollWidth || containerRect.width;
    const height = container.scrollHeight || containerRect.height;
    setContainerSize({ width, height });

    const newPoints: Point[] = [];

    litCardIds.forEach((id) => {
      const el = container.querySelector(`[data-card-id="${id}"]`) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        // Point is center of the card relative to container top-left
        const x = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top + rect.height / 2;
        newPoints.push({ id, x, y });
      }
    });

    setPoints(newPoints);

    if (newPoints.length < 2) {
      setLines([]);
      return;
    }

    // Build the luminous web: connect sequentially and with nearest neighbors
    // to create an ethereal constellation effect
    const newLines: ConnectionLine[] = [];
    const connectionKeySet = new Set<string>();

    const addConnection = (p1: Point, p2: Point) => {
      if (p1.id === p2.id) return;
      const key = [p1.id, p2.id].sort().join('--');
      if (connectionKeySet.has(key)) return;
      connectionKeySet.add(key);

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Organic subtle arc/curve between cards
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      
      // Perpendicular slight curve
      const normalX = -dy / (dist || 1);
      const normalY = dx / (dist || 1);
      // Small randomized deterministic sag/bow
      const seed = ((p1.x * 13 + p2.y * 17) % 30) - 15;
      const curveAmount = Math.min(24, dist * 0.06) + seed * 0.3;

      newLines.push({
        id: key,
        from: p1,
        to: p2,
        distance: dist,
        midX: midX + normalX * curveAmount,
        midY: midY + normalY * curveAmount,
        curveOffsetX: normalX * curveAmount,
        curveOffsetY: normalY * curveAmount,
      });
    };

    // 1. Chronological order connection (thread of discovery)
    for (let i = 0; i < newPoints.length - 1; i++) {
      addConnection(newPoints[i], newPoints[i + 1]);
    }

    // 2. Spatial proximity connections for constellation mesh
    for (let i = 0; i < newPoints.length; i++) {
      const p1 = newPoints[i];
      // Sort other points by distance
      const others = newPoints
        .filter((_, idx) => idx !== i)
        .map((p2) => {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          return { point: p2, dist: Math.sqrt(dx * dx + dy * dy) };
        })
        .sort((a, b) => a.dist - b.dist);

      // Connect to closest 1 or 2 neighbors if distance is reasonable (< 700px)
      if (others[0] && others[0].dist < 750) {
        addConnection(p1, others[0].point);
      }
      if (others[1] && others[1].dist < 550) {
        addConnection(p1, others[1].point);
      }
    }

    setLines(newLines);
  };

  useEffect(() => {
    updatePositions();

    const handleResize = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(updatePositions);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (gridContainerRef.current) {
      resizeObserver.observe(gridContainerRef.current);
    }

    // Secondary timer to accommodate grid rendering and image/video load layout shifts
    const timer1 = setTimeout(updatePositions, 100);
    const timer2 = setTimeout(updatePositions, 450);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      resizeObserver.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [litCardIds, gridContainerRef]);

  if (!isVisible || lines.length === 0) return null;

  // Lamp tone styling
  const colorSchemeMap: Record<LampWarmth, { core: string; glow: string; halo: string; particle: string }> = {
    'warm-amber': {
      core: '#fef3c7',
      glow: '#f59e0b',
      halo: 'rgba(245, 158, 11, 0.35)',
      particle: '#fbbf24',
    },
    'golden-vintage': {
      core: '#fef9c3',
      glow: '#eab308',
      halo: 'rgba(234, 179, 8, 0.4)',
      particle: '#fde047',
    },
    'candle-glow': {
      core: '#ffedd5',
      glow: '#f97316',
      halo: 'rgba(249, 115, 22, 0.4)',
      particle: '#fb923c',
    },
    'daylight': {
      core: '#ffffff',
      glow: '#facc15',
      halo: 'rgba(254, 240, 138, 0.35)',
      particle: '#fef08a',
    },
  };

  const colorScheme = colorSchemeMap[lampWarmth] || colorSchemeMap['warm-amber'];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-0 overflow-visible transition-opacity duration-700"
      style={{
        width: containerSize.width || '100%',
        height: containerSize.height || '100%',
      }}
    >
      <svg
        className="w-full h-full overflow-visible"
        style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.25))' }}
      >
        <defs>
          {/* Linear gradient for smooth luminous glow */}
          <linearGradient id="lightBeamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorScheme.glow} stopOpacity="0.25" />
            <stop offset="50%" stopColor={colorScheme.core} stopOpacity="0.85" />
            <stop offset="100%" stopColor={colorScheme.glow} stopOpacity="0.25" />
          </linearGradient>

          {/* Radial node glow */}
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colorScheme.core} stopOpacity="0.9" />
            <stop offset="40%" stopColor={colorScheme.glow} stopOpacity="0.5" />
            <stop offset="100%" stopColor={colorScheme.glow} stopOpacity="0" />
          </radialGradient>

          {/* Filter for ethereal aura */}
          <filter id="lightGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Diffuse soft background halo of the light beam */}
        {lines.map((line) => {
          const path = `M ${line.from.x} ${line.from.y} Q ${line.midX} ${line.midY} ${line.to.x} ${line.to.y}`;
          return (
            <path
              key={`halo-${line.id}`}
              d={path}
              fill="none"
              stroke={colorScheme.glow}
              strokeWidth="10"
              strokeOpacity="0.18"
              strokeLinecap="round"
              className="animate-pulse"
              style={{ animationDuration: '4s' }}
            />
          );
        })}

        {/* 2. Intermediate luminous sheath */}
        {lines.map((line) => {
          const path = `M ${line.from.x} ${line.from.y} Q ${line.midX} ${line.midY} ${line.to.x} ${line.to.y}`;
          return (
            <path
              key={`glow-${line.id}`}
              d={path}
              fill="none"
              stroke={colorScheme.glow}
              strokeWidth="4"
              strokeOpacity="0.45"
              strokeLinecap="round"
              className="light-connection-beam"
            />
          );
        })}

        {/* 3. Core golden filament line */}
        {lines.map((line) => {
          const path = `M ${line.from.x} ${line.from.y} Q ${line.midX} ${line.midY} ${line.to.x} ${line.to.y}`;
          return (
            <path
              key={`core-${line.id}`}
              d={path}
              fill="none"
              stroke="url(#lightBeamGradient)"
              strokeWidth="1.75"
              strokeOpacity="0.85"
              strokeDasharray="4 2"
              className="light-connection-filament"
            />
          );
        })}

        {/* 4. Golden node halos at each lit card position */}
        {points.map((pt) => (
          <g key={`node-${pt.id}`}>
            {/* Outer halo */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r="24"
              fill="url(#nodeGlow)"
              className="animate-pulse"
              style={{ animationDuration: '3s' }}
            />
            {/* Sparkling star center */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill={colorScheme.core}
              opacity="0.9"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
