import { describe, expect, it } from 'vitest';

import {
  BALL_SIZE,
  COURT,
  initialState,
  PADDLE,
  type PongState,
  startGame,
  step,
  WINNING_SCORE,
} from '@/features/pong/hooks/usePongGame';

const half = () => 0.5;
const idle = { up: false, down: false };

const playing = (overrides: Partial<PongState> = {}): PongState => ({ ...startGame(half), ...overrides });

describe('pong step', () => {
  it('does nothing until the game starts', () => {
    const waiting = initialState(half);
    expect(step(waiting, { up: true, down: false })).toBe(waiting);
  });

  it('starts a fresh game with the ball in the centre', () => {
    const state = startGame(half);
    expect(state.phase).toBe('playing');
    expect(state.score).toEqual({ player: 0, cpu: 0 });
    expect(state.ball).toMatchObject({ x: COURT.width / 2, y: COURT.height / 2 });
  });

  it('moves the ball by its velocity', () => {
    const next = step(playing({ ball: { x: 400, y: 250, vx: 4, vy: 1 } }), idle, half);
    expect(next.ball).toEqual({ x: 404, y: 251, vx: 4, vy: 1 });
  });

  it('moves the player paddle and keeps it inside the court', () => {
    expect(step(playing({ player: 100 }), { up: true, down: false }, half).player).toBe(95);
    expect(step(playing({ player: 2 }), { up: true, down: false }, half).player).toBe(0);
    const bottom = COURT.height - PADDLE.height;
    expect(step(playing({ player: bottom }), { up: false, down: true }, half).player).toBe(bottom);
  });

  it('bounces off the top and bottom walls', () => {
    expect(step(playing({ ball: { x: 400, y: 6, vx: 4, vy: -3 } }), idle, half).ball.vy).toBe(3);
    expect(step(playing({ ball: { x: 400, y: COURT.height - 6, vx: 4, vy: 3 } }), idle, half).ball.vy).toBe(-3);
  });

  it('returns the ball faster from the player paddle, with spin from the hit point', () => {
    const face = PADDLE.margin + PADDLE.width;
    const state = playing({ player: 200, ball: { x: face + BALL_SIZE / 2 + 2, y: 270, vx: -4, vy: 0 } });
    const { ball } = step(state, idle, half);
    expect(ball.vx).toBeCloseTo(4.2);
    expect(ball.vy).toBeCloseTo((270 - (200 + PADDLE.height / 2)) * 0.1);
    expect(ball.x).toBe(face + BALL_SIZE / 2);
  });

  it('lets the ball through when the paddle is elsewhere and scores for the cpu', () => {
    const state = playing({ player: 0, ball: { x: 2, y: 400, vx: -4, vy: 0 } });
    const next = step(state, idle, half);
    expect(next.score).toEqual({ player: 0, cpu: 1 });
    // The player conceded, so the next serve goes towards the player.
    expect(next.ball).toMatchObject({ x: COURT.width / 2, vx: -4 });
  });

  it('the cpu paddle follows the ball', () => {
    const state = playing({ cpu: 0, ball: { x: 400, y: 400, vx: 4, vy: 0 } });
    expect(step(state, idle, half).cpu).toBeGreaterThan(0);
  });

  it('ends the game when someone reaches the winning score', () => {
    const state = playing({
      cpu: 0,
      score: { player: WINNING_SCORE - 1, cpu: 2 },
      ball: { x: COURT.width - 1, y: 400, vx: 4, vy: 0 },
    });
    const next = step(state, idle, half);
    expect(next.phase).toBe('over');
    expect(next.winner).toBe('player');
    expect(step(next, idle, half)).toBe(next);
  });
});
