import { useCallback, useRef } from 'react';

import {
  BALL_SIZE,
  COURT,
  PADDLE,
  type PongState,
  usePongGame,
  WINNING_SCORE,
} from '@/features/pong/hooks/usePongGame';

const FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Line = { text: string; size: number; gap: number };

const OVERLAYS: Record<'waiting' | 'over', (state: PongState) => Line[]> = {
  waiting: () => [
    { text: 'PONG', size: 56, gap: 80 },
    { text: 'PRESS SPACE OR CLICK TO START', size: 14, gap: 30 },
  ],
  over: (state) => [
    { text: state.winner === 'player' ? 'YOU WIN!' : 'CPU WINS', size: 36, gap: 60 },
    { text: `${state.score.player} - ${state.score.cpu}`, size: 28, gap: 50 },
    { text: 'SPACE FOR A REMATCH', size: 12, gap: 30 },
  ],
};

const drawFrame = (ctx: CanvasRenderingContext2D, state: PongState) => {
  const { width, height } = COURT;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  ctx.setLineDash([10, 14]);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fff';
  ctx.font = `64px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(String(state.score.player), width / 2 - 40, 80);
  ctx.textAlign = 'left';
  ctx.fillText(String(state.score.cpu), width / 2 + 40, 80);

  ctx.fillRect(PADDLE.margin, state.player, PADDLE.width, PADDLE.height);
  ctx.fillRect(width - PADDLE.margin - PADDLE.width, state.cpu, PADDLE.width, PADDLE.height);
  if (state.phase === 'playing') {
    ctx.fillRect(state.ball.x - BALL_SIZE / 2, state.ball.y - BALL_SIZE / 2, BALL_SIZE, BALL_SIZE);
    return;
  }

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  let y = height / 2 - 30;
  for (const line of OVERLAYS[state.phase](state)) {
    ctx.font = `${line.size}px ${FONT}`;
    ctx.fillText(line.text, width / 2, y);
    y += line.gap;
  }
};

export function PongCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback((state: PongState) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawFrame(ctx, state);
  }, []);
  const { start } = usePongGame(draw);

  return (
    <canvas
      ref={canvasRef}
      width={COURT.width}
      height={COURT.height}
      onClick={start}
      aria-label={`Pong game against the computer, first to ${WINNING_SCORE} points`}
      className="aspect-[8/5] w-full max-w-[800px] rounded-lg border bg-black"
    />
  );
}
