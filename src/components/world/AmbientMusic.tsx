import { useEffect, useRef, useState } from "react";

/**
 * Generative ambient pad — slow drifting chords built with the Web Audio API,
 * so there is no audio file to load and the loop never repeats exactly.
 */
const SCALE = [174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0, 440.0, 523.25];

export default function AmbientMusic() {
  const [on, setOn] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const start = () => {
      if (ctxRef.current) return;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      filter.Q.value = 0.4;
      filter.connect(master);

      ctxRef.current = ctx;
      gainRef.current = master;
      master.gain.linearRampToValueAtTime(on ? 0.16 : 0, ctx.currentTime + 4);

      const voice = (freq: number, dur: number, pan: number) => {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const g = ctx.createGain();
        const p = ctx.createStereoPanner();
        osc.type = "sine";
        sub.type = "triangle";
        osc.frequency.value = freq;
        sub.frequency.value = freq / 2;
        sub.detune.value = 6;
        g.gain.value = 0;
        p.pan.value = pan;
        osc.connect(g);
        sub.connect(g);
        g.connect(p);
        p.connect(filter);
        const t = ctx.currentTime;
        g.gain.linearRampToValueAtTime(0.12, t + dur * 0.4);
        g.gain.linearRampToValueAtTime(0, t + dur);
        osc.start(t);
        sub.start(t);
        osc.stop(t + dur + 0.1);
        sub.stop(t + dur + 0.1);
      };

      const step = () => {
        const pick = () => SCALE[Math.floor(Math.random() * SCALE.length)]!;
        voice(pick(), 7 + Math.random() * 5, (Math.random() - 0.5) * 1.2);
        if (Math.random() > 0.45) voice(pick(), 6 + Math.random() * 6, (Math.random() - 0.5) * 1.2);
        timer.current = window.setTimeout(step, 2600 + Math.random() * 3200);
      };
      step();
    };

    const kick = () => {
      start();
      void ctxRef.current?.resume();
    };
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    start();

    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      if (timer.current) window.clearTimeout(timer.current);
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    const g = gainRef.current;
    if (!ctx || !g) return;
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.linearRampToValueAtTime(on ? 0.16 : 0, ctx.currentTime + 1.2);
  }, [on]);

  return (
    <button
      onClick={() => setOn((v) => !v)}
      aria-label={on ? "Mute ambient music" : "Play ambient music"}
      className="pointer-events-auto absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-card-foreground shadow-lg backdrop-blur transition-colors hover:bg-accent"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7" /> : <path d="M17 9.5l4 5M21 9.5l-4 5" />}
      </svg>
    </button>
  );
}
