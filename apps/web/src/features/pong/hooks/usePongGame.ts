import { useCallback, useEffect, useRef } from 'react';

export const COURT = { width: 800, height: 500 } as const;
export const PADDLE = { width: 12, height: 80, margin: 20 } as const;
export const BALL_SIZE = 10;
export const WINNING_SCORE = 5;

const PLAYER_SPEED = 5;
const CPU_SPEED = 3.5;
const CPU_DEAD_ZONE = 4;
const SERVE_SPEED = 4;
const SPEED_UP = 1.05;
const SPIN = 0.1;
const MAX_VX = 12;
const MAX_VY = 10;

export type Phase = 'waiting' | 'playing' | 'over';
export type Side = 'player' | 'cpu';
export type Ball = { x: number; y: number; vx: number; vy: number };
export type PongState = {
  phase: Phase;
  ball: Ball;
  // Top edge of each paddle.
  player: number;
  cpu: number;
  score: Record<Side, number>;
  winner: Side | null;
};
export type PongInput = { up: boolean; down: boolean };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const PADDLE_TOP_MAX = COURT.height - PADDLE.height;
const CENTERED = PADDLE_TOP_MAX / 2;

// `towards` is the side that receives the serve.
export const serve = (towards: Side, random: () => number): Ball => ({
  x: COURT.width / 2,
  y: COURT.height / 2,
  vx: towards === 'player' ? -SERVE_SPEED : SERVE_SPEED,
  vy: random() * 4 - 2,
});

export const initialState = (random: () => number = Math.random): PongState => ({
  phase: 'waiting',
  ball: serve('cpu', random),
  player: CENTERED,
  cpu: CENTERED,
  score: { player: 0, cpu: 0 },
  winner: null,
});

export const startGame = (random: () => number = Math.random): PongState => ({
  ...initialState(random),
  phase: 'playing',
  ball: serve(random() > 0.5 ? 'cpu' : 'player', random),
});

// Bounces off a paddle when the ball reaches its face inside its span; the hit point adds spin.
const hitPaddle = (ball: Ball, top: number, side: Side): Ball => {
  const face = side === 'player' ? PADDLE.margin + PADDLE.width : COURT.width - PADDLE.margin - PADDLE.width;
  const reached =
    side === 'player' ? ball.x - BALL_SIZE / 2 <= face && ball.vx < 0 : ball.x + BALL_SIZE / 2 >= face && ball.vx > 0;
  if (!reached || ball.y < top || ball.y > top + PADDLE.height) return ball;
  return {
    x: side === 'player' ? face + BALL_SIZE / 2 : face - BALL_SIZE / 2,
    y: ball.y,
    vx: -ball.vx * SPEED_UP,
    vy: ball.vy + (ball.y - (top + PADDLE.height / 2)) * SPIN,
  };
};

const point = (state: PongState, scorer: Side, random: () => number): PongState => {
  const score = { ...state.score, [scorer]: state.score[scorer] + 1 };
  if (score[scorer] >= WINNING_SCORE) return { ...state, score, phase: 'over', winner: scorer };
  // The side that conceded receives the next serve.
  return { ...state, score, ball: serve(scorer === 'player' ? 'cpu' : 'player', random) };
};

// One frame of the game: pure, so it can be tested without a canvas or timers.
export const step = (state: PongState, input: PongInput, random: () => number = Math.random): PongState => {
  if (state.phase !== 'playing') return state;

  const move = (input.down ? PLAYER_SPEED : 0) - (input.up ? PLAYER_SPEED : 0);
  const player = clamp(state.player + move, 0, PADDLE_TOP_MAX);

  const cpuCenter = state.cpu + PADDLE.height / 2;
  let cpu = state.cpu;
  if (cpuCenter < state.ball.y - CPU_DEAD_ZONE) cpu = Math.min(cpu + CPU_SPEED, PADDLE_TOP_MAX);
  if (cpuCenter > state.ball.y + CPU_DEAD_ZONE) cpu = Math.max(cpu - CPU_SPEED, 0);

  let ball: Ball = { ...state.ball, x: state.ball.x + state.ball.vx, y: state.ball.y + state.ball.vy };
  if (ball.y - BALL_SIZE / 2 <= 0) ball = { ...ball, y: BALL_SIZE / 2, vy: Math.abs(ball.vy) };
  if (ball.y + BALL_SIZE / 2 >= COURT.height)
    ball = { ...ball, y: COURT.height - BALL_SIZE / 2, vy: -Math.abs(ball.vy) };
  ball = hitPaddle(hitPaddle(ball, player, 'player'), cpu, 'cpu');
  ball = { ...ball, vx: clamp(ball.vx, -MAX_VX, MAX_VX), vy: clamp(ball.vy, -MAX_VY, MAX_VY) };

  const next = { ...state, player, cpu, ball };
  if (ball.x < 0) return point(next, 'cpu', random);
  if (ball.x > COURT.width) return point(next, 'player', random);
  return next;
};

const UP_KEYS = new Set(['w', 'W', 'ArrowUp']);
const DOWN_KEYS = new Set(['s', 'S', 'ArrowDown']);

// Runs the loop on animation frames and hands every frame to `draw`; keyboard: W/S or arrows, Space to start.
export function usePongGame(draw: (state: PongState) => void) {
  const state = useRef<PongState>(initialState());
  const input = useRef<PongInput>({ up: false, down: false });
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  const start = useCallback(() => {
    if (state.current.phase !== 'playing') state.current = startGame();
  }, []);

  useEffect(() => {
    const onKey = (pressed: boolean) => (event: KeyboardEvent) => {
      if (UP_KEYS.has(event.key)) input.current.up = pressed;
      else if (DOWN_KEYS.has(event.key)) input.current.down = pressed;
      else if (event.key === ' ' && pressed) start();
      else return;
      event.preventDefault();
    };
    const down = onKey(true);
    const up = onKey(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    let frame = requestAnimationFrame(function loop() {
      state.current = step(state.current, input.current);
      drawRef.current(state.current);
      frame = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [start]);

  return { start };
}
