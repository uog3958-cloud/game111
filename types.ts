
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  WIN = 'WIN'
}

export interface MapData {
  grid: number[][];
  start: { x: number; z: number };
  end: { x: number; z: number };
  deathZoneThreshold?: number; // X coordinate after which collision means game over
}
