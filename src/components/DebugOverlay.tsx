'use client';

import { useEffect, useState } from 'react';

// Visible error catcher for environments without devtools (e.g. Base App webview).
// Shows the error text on screen so it can be read/screenshotted.
export default function DebugOverlay() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      setMsg(`${e.message}\n@ ${e.filename}:${e.lineno}:${e.colno}`);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      setMsg(`Unhandled: ${r?.message ?? String(r)}\n${r?.stack ?? ''}`);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (!msg) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        maxHeight: '40vh',
        overflow: 'auto',
        background: 'rgba(120,0,0,0.95)',
        color: '#fff',
        font: '11px/1.4 monospace',
        padding: '10px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
      onClick={() => setMsg(null)}
    >
      <strong>JS ERROR (tap to dismiss):</strong>
      {'\n'}
      {msg}
    </div>
  );
}
