
import React, { useEffect, useRef } from 'react';
import { GameStatus } from '../types';
import { JUMPSCARE_IMAGE } from '../constants';

interface GameOverlayProps {
  status: GameStatus;
  level: number;
  onStart: () => void;
  onRestart: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ status, level, onStart, onRestart }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (status === GameStatus.GAMEOVER) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://www.myinstants.com/media/sounds/female-scream-24.mp3');
      }
      
      const playScream = async () => {
        try {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1.0;
            await audioRef.current.play();
          }
        } catch (e) {
          console.error("Audio playback failed");
        }
      };

      playScream();

      const timer = setTimeout(() => {
        onRestart();
      }, 4000);
      
      return () => {
        clearTimeout(timer);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    }
  }, [status, onRestart]);

  if (status === GameStatus.PLAYING) return null;

  if (status === GameStatus.GAMEOVER) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center animate-[jumpscare_0.1s_infinite]">
          <img 
            src={JUMPSCARE_IMAGE} 
            alt="YOU DIED" 
            className="w-full h-full object-cover scale-[1.3] brightness-125 contrast-150"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.squarespace-cdn.com/content/v1/51b3dc8ee4b051b96ceb10de/1603741873111-H80B68T8A70198S8WIB0/horror.jpg?format=1500w";
            }}
          />
          <div className="absolute inset-0 bg-red-900/40 mix-blend-color-dodge pointer-events-none"></div>
          <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,1)] pointer-events-none"></div>
          <style>{`
            @keyframes jumpscare {
              0% { transform: scale(1.3) translate(2px, 2px); }
              25% { transform: scale(1.35) translate(-2px, -3px); }
              50% { transform: scale(1.3) translate(-3px, 0px); }
              75% { transform: scale(1.35) translate(3px, 1px); }
              100% { transform: scale(1.3) translate(1px, -2px); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (status === GameStatus.WIN) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
        <div className="bg-zinc-900 border border-zinc-700 p-12 rounded-2xl text-center shadow-2xl max-w-lg">
          <h1 className="text-5xl font-black text-white mb-4 italic tracking-tighter uppercase">Ascended</h1>
          <p className="text-zinc-400 text-lg mb-8 uppercase tracking-widest">The nightmare is over. For now.</p>
          <button 
            onClick={onRestart}
            className="px-12 py-4 bg-white hover:bg-zinc-200 text-black font-black rounded-lg transition-all"
          >
            EXIT SYSTEM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <div className="max-w-md w-full p-10 bg-zinc-950 rounded-2xl border border-zinc-800 text-center shadow-2xl">
        <div className="mb-6 inline-block p-3 bg-white/5 rounded-full border border-white/10">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Abyss Runner</h1>
        <p className="text-zinc-500 mb-10 font-medium uppercase text-xs tracking-widest">3D Pathfinding Survival</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <div className="text-white font-black text-lg">WASD</div>
            <div className="text-zinc-600 text-[10px] uppercase font-bold mt-1">Controls</div>
          </div>
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <div className="text-red-500 font-black text-lg">Level 3</div>
            <div className="text-zinc-600 text-[10px] uppercase font-bold mt-1">Danger Zone</div>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="w-full py-5 bg-white hover:bg-zinc-200 text-black font-black text-xl rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          START PROTOCOL
        </button>
      </div>
    </div>
  );
};

export default GameOverlay;
