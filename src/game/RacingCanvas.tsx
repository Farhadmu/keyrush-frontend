'use client';

import React, { useEffect, useRef } from 'react';

export interface RacerVisualState {
  userId: string;
  username: string;
  carId: string;
  progressPercent: number; // 0 to 100
  speed: number;
  nitroActive: boolean;
  rankPosition: number;
  finished: boolean;
  isCurrentPlayer?: boolean;
}

interface RacingCanvasProps {
  racers: RacerVisualState[];
  trackLength?: number;
  raceStarted?: boolean;
}

const CAR_COLORS: Record<string, { body: string; trim: string; neon: string }> = {
  car_cyber_phantom: { body: '#2563EB', trim: '#60A5FA', neon: '#00F0FF' },
  car_neon_viper: { body: '#7C3AED', trim: '#C084FC', neon: '#A855F7' },
  car_solaris_drift: { body: '#D97706', trim: '#FBBF24', neon: '#EAB308' },
  car_crimson_fury: { body: '#DC2626', trim: '#F87171', neon: '#EF4444' },
};

export default function RacingCanvas({ racers, trackLength = 1000, raceStarted }: RacingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas with dark asphalt gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0a0f1d');
      bgGrad.addColorStop(1, '#050811');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Determine lane layout based on racer count (between 2 and 7)
      const numLanes = Math.max(racers.length, 2);
      const laneHeight = Math.min(65, (height - 60) / numLanes);
      const startX = 60;
      const finishX = width - 80;
      const trackSpan = finishX - startX;

      // Draw Track Grid & Lanes
      for (let i = 0; i < numLanes; i++) {
        const laneY = 40 + i * laneHeight;

        // Lane asphalt background
        ctx.fillStyle = i % 2 === 0 ? 'rgba(17, 24, 39, 0.6)' : 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(startX - 20, laneY, trackSpan + 60, laneHeight);

        // Lane divider dashed lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.moveTo(startX - 20, laneY + laneHeight);
        ctx.lineTo(finishX + 40, laneY + laneHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Start Line
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, 35);
      ctx.lineTo(startX, 40 + numLanes * laneHeight);
      ctx.stroke();

      // Draw Animated Checkered Finish Line
      const finishLineWidth = 16;
      const numSquaresY = Math.floor((numLanes * laneHeight) / 10);
      for (let sq = 0; sq < numSquaresY; sq++) {
        const isWhite = (sq % 2 === 0);
        ctx.fillStyle = isWhite ? '#FFFFFF' : '#111827';
        ctx.fillRect(finishX, 40 + sq * 10, finishLineWidth / 2, 10);
        ctx.fillStyle = isWhite ? '#111827' : '#FFFFFF';
        ctx.fillRect(finishX + finishLineWidth / 2, 40 + sq * 10, finishLineWidth / 2, 10);
      }

      // Finish Line Header Label
      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('FINISH', finishX - 10, 30);

      // Render Each Racer's Vehicle
      racers.forEach((racer, index) => {
        const laneY = 40 + index * laneHeight + laneHeight / 2;
        const progress = Math.min(Math.max(racer.progressPercent / 100, 0), 1);
        const carX = startX + progress * trackSpan;
        const color = CAR_COLORS[racer.carId] || CAR_COLORS.car_cyber_phantom;

        // Nitro Flame Effect
        if (racer.nitroActive && progress < 1) {
          const flameLength = 20 + Math.sin(tick * 0.5) * 8;
          const flameGrad = ctx.createLinearGradient(carX - flameLength, laneY, carX, laneY);
          flameGrad.addColorStop(0, 'transparent');
          flameGrad.addColorStop(0.5, color.neon);
          flameGrad.addColorStop(1, '#FFFFFF');
          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.moveTo(carX - 2, laneY - 5);
          ctx.lineTo(carX - flameLength, laneY);
          ctx.lineTo(carX - 2, laneY + 5);
          ctx.closePath();
          ctx.fill();

          // Nitro sparks
          ctx.fillStyle = color.neon;
          ctx.fillRect(carX - flameLength - 4, laneY + (Math.sin(tick) * 4), 2, 2);
          ctx.fillRect(carX - flameLength - 8, laneY + (Math.cos(tick) * 4), 3, 3);
        }

        // Draw Car Body (2.5D Sleek Aerodynamic Silhouette)
        const carWidth = 44;
        const carHeight = 20;

        // Underglow neon shadow
        ctx.shadowColor = racer.nitroActive ? color.neon : color.body;
        ctx.shadowBlur = racer.nitroActive ? 15 : 6;

        ctx.fillStyle = color.body;
        // Rounded car chassis
        ctx.beginPath();
        ctx.roundRect(carX, laneY - carHeight / 2, carWidth, carHeight, [4, 10, 10, 4]);
        ctx.fill();

        // Car Roof Cockpit / Windshield
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(carX + 10, laneY - carHeight / 2 + 3, 18, carHeight - 6, [2, 5, 5, 2]);
        ctx.fill();

        // Racing Trim Stripe
        ctx.fillStyle = color.trim;
        ctx.fillRect(carX + 4, laneY - 2, carWidth - 8, 4);

        // Headlights (Twin Cyber Beam)
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(carX + carWidth - 3, laneY - carHeight / 2 + 2, 3, 4);
        ctx.fillRect(carX + carWidth - 3, laneY + carHeight / 2 - 6, 3, 4);

        // Taillights
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(carX, laneY - carHeight / 2 + 2, 2, 3);
        ctx.fillRect(carX, laneY + carHeight / 2 - 5, 2, 3);

        // Player Tag & Speedometer Label
        ctx.fillStyle = racer.isCurrentPlayer ? '#00F0FF' : '#E2E8F0';
        ctx.font = racer.isCurrentPlayer ? 'bold 11px Inter' : '10px Inter';
        const tagText = `${racer.username} ${racer.finished ? '🏁' : `[${Math.round(racer.speed)} km/h]`}`;
        ctx.fillText(tagText, Math.max(carX - 10, 10), laneY - carHeight / 2 - 6);

        // Position Badge
        if (racer.rankPosition > 0) {
          ctx.fillStyle = racer.rankPosition === 1 ? '#F59E0B' : '#94A3B8';
          ctx.beginPath();
          ctx.arc(carX - 12, laneY, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#080D19';
          ctx.font = 'bold 9px JetBrains Mono';
          ctx.fillText(`${racer.rankPosition}`, carX - 15, laneY + 3);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [racers, trackLength, raceStarted]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-primary/20 bg-surface/80 p-2 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-accent" />
          <span className="font-display text-xs font-bold tracking-wider text-accent uppercase">
            Live 2.5D Racing Arena
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono text-text-muted">
          <span>{racers.length} Racers in Lane</span>
          <span>Max Track: 1000m</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={960}
        height={Math.max(240, Math.min(480, 50 + racers.length * 60))}
        className="w-full rounded-xl"
      />
    </div>
  );
}
