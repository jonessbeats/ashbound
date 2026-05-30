'use client';
import { useRef, useState, useCallback } from 'react';
import { EventBus, GameEvents } from '@/game/EventBus';

const MAX_RADIUS = 56;

export default function Joystick() {
  const [base, setBase] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);

  const emitMove = useCallback((dx: number, dy: number) => {
    const len = Math.hypot(dx, dy);
    const max = MAX_RADIUS;
    if (len > 0) {
      const clamped = Math.min(len, max);
      EventBus.emit(GameEvents.MOVE_INPUT, {
        x: (dx / len) * (clamped / max),
        y: (dy / len) * (clamped / max),
      });
    } else {
      EventBus.emit(GameEvents.MOVE_INPUT, { x: 0, y: 0 });
    }
  }, []);

  const onStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchId.current = t.identifier;
    setBase({ x: t.clientX, y: t.clientY });
    setKnob({ x: 0, y: 0 });
  };

  const onMove = (e: React.TouchEvent) => {
    if (!base) return;
    const t = Array.from(e.changedTouches).find((x) => x.identifier === touchId.current);
    if (!t) return;
    let dx = t.clientX - base.x;
    let dy = t.clientY - base.y;
    const len = Math.hypot(dx, dy);
    if (len > MAX_RADIUS) {
      dx = (dx / len) * MAX_RADIUS;
      dy = (dy / len) * MAX_RADIUS;
    }
    setKnob({ x: dx, y: dy });
    emitMove(dx, dy);
  };

  const onEnd = () => {
    touchId.current = null;
    setBase(null);
    setKnob({ x: 0, y: 0 });
    EventBus.emit(GameEvents.MOVE_INPUT, { x: 0, y: 0 });
  };

  return (
    <div
      className="absolute inset-0 z-10 touch-none"
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      {base && (
        <>
          
          <div
            className="pointer-events-none absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/30 bg-slate-900/40"
            style={{ left: base.x, top: base.y }}
          />
          
          <div
            className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/70 bg-amber-500/40"
            style={{ left: base.x + knob.x, top: base.y + knob.y }}
          />
        </>
      )}
    </div>
  );
}
