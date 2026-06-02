"use client";

import { useEffect, useLayoutEffect, useState, useCallback, useRef, memo } from "react";
import { createPortal } from "react-dom";

const FLIP_WORDS = ["Explore", "Connect", "Dream", "Chat", "Love", "Lily"];
const EYE_MS = 550;
/** Full counter run 0 → 100 (always completes once) */
const COUNTER_MS = 2800;
const WORD_MS = 1400;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const WORD_SLOT_CH = Math.max(...FLIP_WORDS.map((w) => w.length));

const DigitColumn = memo(function DigitColumn({
  digit,
  heightEm = 1,
}: {
  digit: number;
  heightEm?: number;
}) {
  const d = Math.min(9, Math.max(0, digit));
  return (
    <span
      className="inline-block overflow-hidden align-bottom tabular-nums"
      style={{ width: "0.62em", height: `${heightEm}em`, lineHeight: 1 }}
    >
      <span
        className="flex flex-col will-change-transform"
        style={{
          transform: `translate3d(0, calc(-${heightEm}em * ${d}), 0)`,
          transition: `transform 0.42s ${EASE}`,
        }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span
            key={n}
            className="flex shrink-0 items-center justify-center"
            style={{ height: `${heightEm}em`, width: "0.62em" }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
});

const FlipCounter = memo(function FlipCounter({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, Math.floor(value)));
  const hundreds = Math.floor(v / 100);
  const tens = Math.floor((v % 100) / 10);
  const ones = v % 10;

  return (
    <div
      className="flex items-baseline font-serif text-5xl sm:text-6xl md:text-7xl text-zinc-100 leading-none"
      aria-live="polite"
      aria-label={`Loading ${v} percent`}
    >
      <DigitColumn digit={hundreds} heightEm={1} />
      <DigitColumn digit={tens} heightEm={1} />
      <DigitColumn digit={ones} heightEm={1} />
    </div>
  );
});

const FlipWords = memo(function FlipWords() {
  const [index, setIndex] = useState(0);
  const lineEm = 1.15;

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % FLIP_WORDS.length);
    }, WORD_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="inline-block overflow-hidden align-middle text-center"
      style={{ width: `${WORD_SLOT_CH}ch`, height: `${lineEm}em` }}
    >
      <span
        className="flex flex-col will-change-transform"
        style={{
          transform: `translate3d(0, calc(-${lineEm}em * ${index}), 0)`,
          transition: `transform 0.55s ${EASE}`,
        }}
      >
        {FLIP_WORDS.map((word) => (
          <span
            key={word}
            className="flex shrink-0 items-center justify-center font-serif italic"
            style={{ height: `${lineEm}em`, width: `${WORD_SLOT_CH}ch` }}
          >
            {word}
          </span>
        ))}
      </span>
    </span>
  );
});

interface ScreenLoaderProps {
  onExited?: () => void;
}

export default function ScreenLoader({ onExited }: ScreenLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"opening" | "active" | "closing" | "done">("opening");
  const [progress, setProgress] = useState(0);
  const finishRef = useRef(false);

  const finish = useCallback(() => {
    if (finishRef.current) return;
    finishRef.current = true;
    setPhase("closing");
    setTimeout(() => {
      setPhase("done");
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("lily:loader-done"));
      onExited?.();
    }, EYE_MS);
  }, [onExited]);

  useLayoutEffect(() => {
    setMounted(true);
    document.documentElement.style.backgroundColor = "#000";
    document.body.style.backgroundColor = "#000";
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPhase("active"), EYE_MS);
    return () => clearTimeout(t);
  }, []);

  // Counter 0 → 100 over fixed duration (ignores API / profile load)
  useEffect(() => {
    if (phase !== "active") return;

    const start = performance.now();
    let raf = 0;
    let lastPct = -1;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / COUNTER_MS);
      const eased = 1 - (1 - t) ** 2.2;
      const pct = Math.min(100, Math.floor(eased * 100));

      if (pct !== lastPct) {
        lastPct = pct;
        setProgress(pct);
      }

      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "active" && progress >= 100) {
      finish();
    }
  }, [phase, progress, finish]);

  if (!mounted || phase === "done") return null;

  const eyeClass =
    phase === "opening"
      ? "screen-loader-eye-open"
      : phase === "closing"
        ? "screen-loader-eye-close"
        : "";

  return createPortal(
    <div
      className={`screen-loader fixed inset-0 z-[9999] bg-black text-zinc-100 ${eyeClass}`}
      role="status"
      aria-label="Loading"
      style={{ width: "100vw", height: "100dvh" }}
    >
      <div className="screen-loader-content flex h-full w-full flex-col">
        <p className="absolute top-8 left-8 md:top-10 md:left-10 text-[10px] md:text-xs tracking-[0.35em] uppercase text-zinc-600 font-sans select-none">
          Lily
        </p>

        <div className="flex flex-1 items-center justify-center px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-zinc-100 tracking-tight">
            <FlipWords />
          </h1>
        </div>

        <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12">
          <FlipCounter value={progress} />
        </div>
      </div>
    </div>,
    document.body
  );
}
