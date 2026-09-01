import { useEffect, useRef, useState } from "react";

/**
 * Background audio player — loads /music-track-v2.mp3 from the public directory
 * and automatically plays on a continuous loop throughout the application.
 */
export default function AmbientMusic() {
  const [on, setOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/music-track-v2.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const playAudio = async () => {
      if (!audioRef.current || isPlayingRef.current) return;
      try {
        await audioRef.current.play();
        isPlayingRef.current = true;
        // Remove listeners once audio successfully starts playing
        removeInteractionListeners();
      } catch (err) {
        // Autoplay policy blocked audio without user interaction
        isPlayingRef.current = false;
      }
    };

    const handleUserInteraction = () => {
      if (on && !isPlayingRef.current) {
        void playAudio();
      }
    };

    const addInteractionListeners = () => {
      window.addEventListener("pointerdown", handleUserInteraction);
      window.addEventListener("keydown", handleUserInteraction);
      window.addEventListener("touchstart", handleUserInteraction);
    };

    const removeInteractionListeners = () => {
      window.removeEventListener("pointerdown", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };

    if (on) {
      void playAudio();
      addInteractionListeners();
    }

    return () => {
      removeInteractionListeners();
      audio.pause();
      audioRef.current = null;
      isPlayingRef.current = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (on) {
      void audio.play().then(() => {
        isPlayingRef.current = true;
      }).catch(() => {
        isPlayingRef.current = false;
      });
    } else {
      audio.pause();
      isPlayingRef.current = false;
    }
  }, [on]);

  return (
    <button
      onClick={() => setOn((v) => !v)}
      aria-label={on ? "Mute background music" : "Play background music"}
      className="pointer-events-auto absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-card-foreground shadow-lg backdrop-blur transition-colors hover:bg-accent"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7" /> : <path d="M17 9.5l4 5M21 9.5l-4 5" />}
      </svg>
    </button>
  );
}

