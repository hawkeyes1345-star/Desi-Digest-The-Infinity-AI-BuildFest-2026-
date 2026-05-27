import { useEffect, useRef, useState } from "react";
import { useAppearance } from "@/lib/appearance";

const VIDEOS = [
  "/videos/bg-1.mp4",
  "/videos/bg-2.mp4",
  "/videos/bg-3.mp4",
  "/videos/bg-4.mp4",
  "/videos/bg-5.mp4",
  "/videos/bg-6.mp4",
];

const INTERVAL_MS = 13000;

/**
 * Cinematic full-viewport video background.
 * - Two stacked <video> elements crossfade between clips every ~13s
 * - autoplay + muted + playsInline = mobile-safe
 * - Falls back to a warm gradient if videos fail or Reduce Motion is on
 */
export function VideoBackground() {
  const { animations } = useAppearance();
  const [active, setActive] = useState(0); // index playing in slot A
  const [next, setNext] = useState(1); // index playing in slot B
  const [showB, setShowB] = useState(false);
  const [failed, setFailed] = useState(0);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);

  const videoFailed = failed >= VIDEOS.length;

  // Keep both videos trying to play (autoplay may be deferred on first paint)
  useEffect(() => {
    if (!animations || videoFailed) return;
    const play = (el: HTMLVideoElement | null) => {
      el?.play().catch(() => {
        /* will retry on next state change / user gesture */
      });
    };
    play(aRef.current);
    play(bRef.current);
  }, [animations, videoFailed, active, next, showB]);

  // Crossfade scheduler
  useEffect(() => {
    if (!animations || videoFailed) return;
    const id = setInterval(() => {
      setShowB((prev) => {
        const flipping = !prev;
        // After fade completes, advance the *hidden* slot to the next clip
        window.setTimeout(() => {
          if (flipping) {
            // B is now visible; rotate A to the upcoming clip
            setActive((a) => (a + 2) % VIDEOS.length);
          } else {
            setNext((n) => (n + 2) % VIDEOS.length);
          }
        }, 1800);
        return flipping;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [animations, videoFailed]);

  const handleError = () => setFailed((f) => f + 1);

  // Reduce motion OR all videos failed → warm gradient fallback
  if (!animations || videoFailed) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-warm-gradient"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/35 to-background/70" />
        <div className="absolute inset-0 bg-black/15" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <video
        ref={aRef}
        key={`a-${active}`}
        src={VIDEOS[active]}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        preload="auto"
        onError={handleError}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ease-in-out ${
          showB ? "opacity-0" : "opacity-100"
        }`}
      />
      <video
        ref={bRef}
        key={`b-${next}`}
        src={VIDEOS[next]}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        preload="auto"
        onError={handleError}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ease-in-out ${
          showB ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Cinematic tint + dark overlay so glassmorphism UI stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(at_20%_0%,color-mix(in_oklab,var(--spice)_22%,transparent),transparent_55%),radial-gradient(at_90%_100%,color-mix(in_oklab,var(--sage)_22%,transparent),transparent_55%)]" />
      <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}
