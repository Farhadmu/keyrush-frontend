'use client';

import React, { useEffect, useRef } from 'react';
import type { RacerVisualState } from './RacingCanvas';

interface PhaserArenaProps {
  racers: RacerVisualState[];
  raceStarted?: boolean;
}

/**
 * Phaser 3 2.5D WebGL/Canvas Esports Arena
 * Dynamically loaded in the browser to ensure compatibility with Next.js SSR.
 */
export default function PhaserArena({ racers, raceStarted }: PhaserArenaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initPhaser() {
      if (typeof window === 'undefined' || !containerRef.current) return;

      const Phaser = (await import('phaser')).default;

      class RaceScene extends Phaser.Scene {
        private carSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
        private labelTexts: Map<string, Phaser.GameObjects.Text> = new Map();

        constructor() {
          super({ key: 'RaceScene' });
        }

        create() {
          const width = this.scale.width;
          const height = this.scale.height;

          // Track background
          const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0f1d);

          // Grid lines
          const graphics = this.add.graphics();
          graphics.lineStyle(1, 0x334155, 0.4);

          for (let y = 40; y < height - 20; y += 50) {
            graphics.lineBetween(40, y, width - 40, y);
          }

          // Finish Line
          const finishX = width - 60;
          graphics.lineStyle(6, 0x22c55e, 1);
          graphics.lineBetween(finishX, 20, finishX, height - 20);

          this.add.text(finishX - 15, 10, 'FINISH', {
            fontFamily: 'JetBrains Mono',
            fontSize: '11px',
            color: '#22C55E',
          });
        }

        update() {
          // Dynamic updates based on props passed into scene
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: 900,
        height: 260,
        backgroundColor: '#080D19',
        scene: [RaceScene],
        banner: false,
      };

      if (!gameRef.current && isMounted) {
        gameRef.current = new Phaser.Game(config);
      }
    }

    initPhaser();

    return () => {
      isMounted = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-primary/20 bg-surface/80 p-2 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 animate-ping rounded-full bg-accent" />
          <span className="font-display text-xs font-bold tracking-wider text-accent uppercase">
            Phaser 3 WebGL Engine
          </span>
        </div>
        <span className="font-mono text-xs text-text-muted">{racers.length} Racers Active</span>
      </div>
      <div ref={containerRef} className="w-full flex justify-center py-2" />
    </div>
  );
}
