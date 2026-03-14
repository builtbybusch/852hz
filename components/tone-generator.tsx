"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Play, Square, Volume2 } from "lucide-react"

import { cn } from "@/lib/utils"

const FREQ = 852

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

  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const stop = useCallback(() => {
    if (oscRef.current) {
      try {
        oscRef.current.stop()
      } catch {
        /* already stopped */
      }
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
    }

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
  }, [])

  const start = useCallback(() => {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(FREQ, ctx.currentTime)
    gain.gain.setValueAtTime(volume / 100, ctx.currentTime)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()

    audioCtxRef.current = ctx
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
  }, [volume])

  const toggle = useCallback(() => {
    if (playing) stop()
    else start()
  }, [playing, start, stop])

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

        <div className="text-[64px] leading-none font-extralight tracking-[-2px] text-secondary-foreground">
          852
          <span className="ml-1 text-2xl font-light text-muted-foreground">
            Hz
          </span>
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

      <a
        href="https://buymeacoffee.com/sahellebusch"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 inline-flex items-center gap-2 rounded-lg bg-[#5F7FFF] px-4 py-2.5 text-base text-white shadow-lg transition-opacity hover:opacity-90"
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
  )
}
