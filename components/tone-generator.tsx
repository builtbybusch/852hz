"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Play, Square, Volume2, MessageSquarePlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { IssueIntakeDialog } from "@/components/issue-intake-dialog"

type WebkitWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

// Short silent MP3 used to keep the iOS audio session in "playback" mode.
// Without this, iOS silences Web Audio oscillator output.
const SILENT_AUDIO_DATA_URI =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRBqSAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZB4P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="

const SOLFEGGIO_FREQUENCIES = [
  { hz: 396, label: "396", description: "Liberation" },
  { hz: 417, label: "417", description: "Change" },
  { hz: 528, label: "528", description: "Healing" },
  { hz: 639, label: "639", description: "Connection" },
  { hz: 741, label: "741", description: "Expression" },
  { hz: 852, label: "852", description: "Intuition" },
] as const

function formatTime(totalSeconds: number): string {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
  const s = String(totalSeconds % 60).padStart(2, "0")
  return `${h}:${m}:${s}`
}

export function ToneGenerator() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(40)
  const [elapsed, setElapsed] = useState(0)
  const [freq, setFreq] = useState(852)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)

  const startSilentAudio = useCallback(() => {
    if (silentAudioRef.current) {
      return
    }
    const audio = new Audio(SILENT_AUDIO_DATA_URI)
    audio.setAttribute("playsinline", "true")
    audio.loop = true
    audio.volume = 0.01
    audio.play().catch(() => {})
    silentAudioRef.current = audio
  }, [])

  const stopSilentAudio = useCallback(() => {
    if (silentAudioRef.current) {
      silentAudioRef.current.pause()
      silentAudioRef.current.removeAttribute("src")
      silentAudioRef.current.load()
      silentAudioRef.current = null
    }
  }, [])

  const getAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      return audioCtxRef.current
    }

    const AudioContextCtor =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext

    if (!AudioContextCtor) {
      return null
    }

    const ctx = new AudioContextCtor()
    audioCtxRef.current = ctx
    return ctx
  }, [])

  const stop = useCallback(() => {
    if (oscRef.current) {
      try {
        oscRef.current.stop()
      } catch {
        /* already stopped */
      }
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
    }

    stopSilentAudio()

    audioCtxRef.current = null
    oscRef.current = null
    gainRef.current = null

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }

    setPlaying(false)
  }, [stopSilentAudio])

  const start = useCallback((ctx: AudioContext) => {
    if (oscRef.current) {
      return
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume / 100, ctx.currentTime)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + 0.01)

    oscRef.current = osc
    gainRef.current = gain

    startTimeRef.current = Date.now()
    setElapsed(0)
    setPlaying(true)

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    if ("wakeLock" in navigator) {
      navigator.wakeLock
        .request("screen")
        .then((wl) => {
          wakeLockRef.current = wl
        })
        .catch(() => {})
    }
  }, [freq, volume])

  const toggle = useCallback(async () => {
    if (playing) {
      stop()
      return
    }

    const ctx = getAudioContext()

    if (!ctx) {
      return
    }

    startSilentAudio()

    if (ctx.state !== "running") {
      await ctx.resume().catch(() => {})
    }

    start(ctx)
  }, [getAudioContext, playing, start, startSilentAudio, stop])

  useEffect(() => {
    if (oscRef.current && audioCtxRef.current) {
      oscRef.current.frequency.setValueAtTime(
        freq,
        audioCtxRef.current.currentTime,
      )
    }
  }, [freq])

  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setValueAtTime(
        volume / 100,
        audioCtxRef.current.currentTime,
      )
    }
  }, [volume])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  useEffect(() => {
    function handleVisibility() {
      if (
        document.visibilityState === "visible" &&
        playing &&
        "wakeLock" in navigator
      ) {
        navigator.wakeLock
          .request("screen")
          .then((wl) => {
            wakeLockRef.current = wl
          })
          .catch(() => {})
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility)
  }, [playing])

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background select-none">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-10 px-6">
        <div className="text-sm font-medium tracking-[0.25em] uppercase text-muted-foreground">
          Frequency
        </div>

        <div className="flex items-center gap-1.5">
          {SOLFEGGIO_FREQUENCIES.map((f) => (
            <button
              key={f.hz}
              onClick={() => setFreq(f.hz)}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1 text-xs font-medium tabular-nums transition-colors",
                freq === f.hz
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <span className="text-[64px] leading-none font-extralight tracking-[-2px] text-secondary-foreground">
              {freq}
            </span>
            <span className="absolute -right-7 bottom-1.5 text-xs font-medium tracking-wider text-muted-foreground/50 uppercase">
              Hz
            </span>
          </div>
          <div className="text-sm tracking-[0.15em] text-muted-foreground">
            {SOLFEGGIO_FREQUENCIES.find((f) => f.hz === freq)?.description}
          </div>
        </div>

        <button
          onClick={toggle}
          aria-label={playing ? "Stop" : "Play"}
          className={cn(
            "relative flex h-[140px] w-[140px] cursor-pointer items-center justify-center rounded-full border-2 outline-none transition-all duration-300 active:scale-95",
            playing
              ? "border-primary shadow-[0_0_40px_rgba(112,112,255,0.2),0_0_80px_rgba(112,112,255,0.08)]"
              : "border-border",
          )}
          style={{
            background: "radial-gradient(circle at 40% 35%, #1e1e3a, #0e0e22)",
          }}
        >
          {playing && (
            <div className="pointer-events-none absolute inset-0 rounded-full border border-primary/30 animate-pulse-ring" />
          )}
          {playing ? (
            <Square className="size-12 fill-accent-foreground text-accent-foreground" />
          ) : (
            <Play className="size-12 fill-[#8888cc] text-[#8888cc]" />
          )}
        </button>

        <div
          className={cn(
            "h-5 text-base font-light tracking-[2px] tabular-nums transition-colors",
            playing ? "text-[#6a6aaa]" : "text-border",
          )}
        >
          {formatTime(elapsed)}
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <div className="text-xs tracking-[0.2em] uppercase text-[#4a4a6a]">
            Volume
          </div>
          <div className="flex w-4/5 items-center gap-3.5">
            <Volume2 className="size-[18px] shrink-0 text-[#4a4a6a]" />
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              aria-label="Volume"
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
            <span className="min-w-9 text-right text-[13px] text-[#5a5a7a]">
              {volume}%
            </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 flex items-center gap-3">
        <button
          onClick={() => setFeedbackOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-lg transition-colors hover:bg-accent"
        >
          <MessageSquarePlus className="size-[18px]" />
          Feedback
        </button>
        <a
          href="https://buymeacoffee.com/sahellebusch"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#5F7FFF] px-4 py-2.5 text-base text-white shadow-lg transition-opacity hover:opacity-90"
          style={{ fontFamily: "var(--font-cookie)" }}
        >
          <img
            src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
            alt=""
            className="h-[25px] w-[25px]"
          />
          Buy me a coffee
        </a>
      </div>

      <IssueIntakeDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  )
}
