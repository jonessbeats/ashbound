'use client';

// ────────────────────────────────────────────────────────────────
// Joystick.tsx — виртуальный джойстик для мобилок (ТЗ §11).
// Появляется в точке касания в левой половине экрана.
// Шлёт направление (-1..1) в Phaser через EventBus.
// ────────────────────────────────────────────────────────────────

import { useRef, useState, useCallback } from 'react';
import { EventBus, GameEvents } from '@/game/EventBus';

const MAX_RADIUS = 56; // максимальный сдвиг ручки от центра (px)

export default function Joystick() {
  // Видим ли джойстик и где он стоит.
  const [base, setBase] = useState<{ x: number; y: number } | null>(null);
  // Смещение ручки относительно базы.
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);

  // Отправить нормализованное направление в Phaser.
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

  // Палец коснулся экрана — ставим базу джойстика здесь.
  const onStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchId.current = t.identifier;
    setBase({ x: t.clientX, y: t.clientY });
    setKnob({ x: 0, y: 0 });
  };

  // Палец двигается — сдвигаем ручку и шлём направление.
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

  // Палец убран — джойстик прячется, движение в ноль.
  const onEnd = () => {
    touchId.current = null;
    setBase(null);
    setKnob({ x: 0, y: 0 });
    EventBus.emit(GameEvents.MOVE_INPUT, { x: 0, y: 0 });
  };

  return (
    <div
      // Зона захвата — левая половина экрана.
      className="absolute inset-y-0 left-0 w-1/2 touch-none"
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      {base && (
        <>
          {/* База джойстика */}
          <div
            className="pointer-events-none absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/30 bg-slate-900/40"
            style={{ left: base.x, top: base.y }}
          />
          {/* Ручка джойстика */}
          <div
            className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/70 bg-amber-500/40"
            style={{ left: base.x + knob.x, top: base.y + knob.y }}
          />
        </>
      )}
    </div>
  );
}
