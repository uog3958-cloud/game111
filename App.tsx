
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStatus, MapData } from './types';
import { MAPS } from './constants';
import GameOverlay from './components/GameOverlay';

const CELL_SIZE = 40;
const PLAYER_RADIUS = 10;
const PLAYER_SPEED = 4;

interface Obstacle {
  centerX: number;
  centerY: number;
  radius: number;
  angle: number;
  angularSpeed: number;
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [level, setLevel] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerPos = useRef({ x: 0, y: 0 });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const obstaclesRef = useRef<Obstacle[]>([]);
  const frameRef = useRef<number>(undefined);
  
  const hitSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    hitSound.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    hitSound.current.volume = 0.5;
  }, []);

  const playHitSound = () => {
    if (hitSound.current) {
      hitSound.current.currentTime = 0;
      hitSound.current.play().catch(() => {});
    }
  };

  const currentMap = MAPS[level];

  const initLevel = useCallback((lv: number) => {
    const map = MAPS[lv];
    if (!map) return;

    playerPos.current = {
      x: map.start.x * CELL_SIZE + CELL_SIZE / 2,
      y: map.start.z * CELL_SIZE + CELL_SIZE / 2
    };

    const obstacles: Obstacle[] = [];
    if (lv === 1) {
      const spots = [{x: 5, z: 3}, {x: 8, z: 5}, {x: 2, z: 5}];
      spots.forEach((spot, i) => {
        obstacles.push({
          centerX: spot.x * CELL_SIZE + CELL_SIZE / 2,
          centerY: spot.z * CELL_SIZE + CELL_SIZE / 2,
          radius: CELL_SIZE * 1.5,
          angle: i * Math.PI,
          angularSpeed: 0.04,
          x: 0,
          y: 0
        });
      });
    } else if (lv === 2) {
      const spots = [
        { x: 4, z: 3 }, { x: 8, z: 5 }, { x: 12, z: 3 }, { x: 16, z: 5 }, { x: 10, z: 7 }
      ];
      spots.forEach((spot, i) => {
        obstacles.push({
          centerX: spot.x * CELL_SIZE + CELL_SIZE / 2,
          centerY: spot.z * CELL_SIZE + CELL_SIZE / 2,
          radius: CELL_SIZE * 1.8,
          angle: i * (Math.PI / 2.5),
          angularSpeed: 0.06,
          x: 0,
          y: 0
        });
      });
    }
    obstaclesRef.current = obstacles;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current[e.key.toLowerCase()] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.key.toLowerCase()] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      initLevel(level);
    }
  }, [level, status, initLevel]);

  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    const keys = keysRef.current;
    let dx = 0;
    let dy = 0;

    if (keys['w']) dy -= PLAYER_SPEED;
    if (keys['s']) dy += PLAYER_SPEED;
    if (keys['a']) dx -= PLAYER_SPEED;
    if (keys['d']) dx += PLAYER_SPEED;

    const nextX = playerPos.current.x + dx;
    const nextY = playerPos.current.y + dy;

    const checkCollision = (tx: number, ty: number) => {
      const gridX = Math.floor(tx / CELL_SIZE);
      const gridY = Math.floor(ty / CELL_SIZE);
      if (gridY < 0 || gridY >= currentMap.grid.length || gridX < 0 || gridX >= currentMap.grid[0].length) return true;
      if (currentMap.grid[gridY][gridX] === 1) return true;
      return false;
    };

    if (!checkCollision(nextX, nextY)) {
      playerPos.current.x = nextX;
      playerPos.current.y = nextY;
    } else {
      const map = MAPS[level];
      playHitSound();
      if (map.deathZoneThreshold !== undefined && Math.floor(playerPos.current.x / CELL_SIZE) >= map.deathZoneThreshold) {
        setStatus(GameStatus.GAMEOVER);
      } else {
        playerPos.current = {
          x: map.start.x * CELL_SIZE + CELL_SIZE / 2,
          y: map.start.z * CELL_SIZE + CELL_SIZE / 2
        };
      }
    }

    obstaclesRef.current.forEach(obs => {
      obs.angle += obs.angularSpeed;
      obs.x = obs.centerX + Math.cos(obs.angle) * obs.radius;
      obs.y = obs.centerY + Math.sin(obs.angle) * obs.radius;
      const dist = Math.sqrt((obs.x - playerPos.current.x)**2 + (obs.y - playerPos.current.y)**2);
      if (dist < PLAYER_RADIUS + 8) {
        const map = MAPS[level];
        playHitSound();
        if (map.deathZoneThreshold !== undefined && Math.floor(playerPos.current.x / CELL_SIZE) >= map.deathZoneThreshold) {
          setStatus(GameStatus.GAMEOVER);
        } else {
          playerPos.current = {
            x: map.start.x * CELL_SIZE + CELL_SIZE / 2,
            y: map.start.z * CELL_SIZE + CELL_SIZE / 2
          };
        }
      }
    });

    const finishGridX = Math.floor(playerPos.current.x / CELL_SIZE);
    const finishGridY = Math.floor(playerPos.current.y / CELL_SIZE);
    if (currentMap.grid[finishGridY]?.[finishGridX] === 3) {
      if (level < MAPS.length - 1) {
        setLevel(l => l + 1);
      } else {
        setStatus(GameStatus.WIN);
      }
    }

    draw();
    frameRef.current = requestAnimationFrame(update);
  }, [status, level, currentMap]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    currentMap.grid.forEach((row, z) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(x * CELL_SIZE, z * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * CELL_SIZE, z * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell === 3) {
          ctx.fillStyle = '#0f0';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#0f0';
          ctx.fillRect(x * CELL_SIZE + 8, z * CELL_SIZE + 8, CELL_SIZE - 16, CELL_SIZE - 16);
          ctx.shadowBlur = 0;
        }
      });
    });

    ctx.fillStyle = '#f00';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f00';
    obstaclesRef.current.forEach(obs => {
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.arc(playerPos.current.x, playerPos.current.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      frameRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [status, update]);

  const canvasWidth = currentMap.grid[0].length * CELL_SIZE;
  const canvasHeight = currentMap.grid.length * CELL_SIZE;

  return (
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center bg-black"
      style={{ touchAction: 'none' }}
    >
      <div 
        className="relative bg-zinc-950 border-[8px] border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
        style={{ width: canvasWidth, height: canvasHeight, minWidth: canvasWidth, minHeight: canvasHeight }}
      >
        <canvas 
          ref={canvasRef} 
          width={canvasWidth} 
          height={canvasHeight}
          className="block"
        />
      </div>
      
      {status === GameStatus.PLAYING && (
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
          <div className="bg-black/60 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-md">
            <span className="text-zinc-500 text-xs uppercase font-bold tracking-widest mr-2">Phase</span>
            <span className="text-white font-black text-xl">{level + 1} <span className="text-zinc-600 text-sm">/ 3</span></span>
          </div>
        </div>
      )}

      <GameOverlay 
        status={status} 
        level={level} 
        onStart={() => setStatus(GameStatus.PLAYING)} 
        onRestart={() => {
          setLevel(0);
          setStatus(GameStatus.START);
        }} 
      />
    </div>
  );
};

export default App;
