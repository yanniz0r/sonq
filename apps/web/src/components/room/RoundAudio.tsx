import { useEffect, useRef, useState } from 'react'

import { Button } from '#/components/ui'

// A tiny silent clip. Playing it from a tap "unlocks" the element on
// browsers (iOS Safari) that otherwise refuse to play without a gesture.
const SILENCE =
  'data:audio/wav;base64,UklGRogAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWQAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA'

interface RoundAudioProps {
  // The current round's audio URL, or null when nothing should play.
  src: string | null
  // When playback should start, in server time. Null plays right away.
  startsAt: number | null
  clockOffset: number
  volume: number
}

// One persistent <audio> element per room. A new `src` (a new round) loads
// and schedules playback at `startsAt`; late joiners seek to where everyone
// else is. The same `src` keeps playing through the reveal.
export function RoundAudio({
  src,
  startsAt,
  clockOffset,
  volume,
}: RoundAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [blocked, setBlocked] = useState(false)
  // Read at play time: a fresh clock offset arrives with every snapshot and
  // must not restart the song.
  const timing = useRef({ startsAt, clockOffset })
  timing.current = { startsAt, clockOffset }
  const unlocked = useRef(false)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current
      if (unlocked.current || !audio || audio.src) return
      unlocked.current = true
      audio.src = SILENCE
      audio.play().catch(() => {
        unlocked.current = false
      })
    }
    document.addEventListener('pointerdown', unlock, { capture: true })
    return () =>
      document.removeEventListener('pointerdown', unlock, { capture: true })
  }, [])

  const play = () => {
    const audio = audioRef.current
    if (!audio) return
    const { startsAt: at, clockOffset: offset } = timing.current
    const elapsedSeconds = at === null ? 0 : (Date.now() + offset - at) / 1000
    if (elapsedSeconds > 0.25) audio.currentTime = elapsedSeconds
    audio.play().then(
      () => setBlocked(false),
      (error: unknown) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError')
          setBlocked(true)
      },
    )
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!src) {
      audio.pause()
      setBlocked(false)
      return
    }
    audio.src = src
    audio.load()
    const { startsAt: at, clockOffset: offset } = timing.current
    const delay = at === null ? 0 : at - (Date.now() + offset)
    const id = setTimeout(play, Math.max(0, delay))
    return () => {
      clearTimeout(id)
      audio.pause()
    }
    // Only a new round restarts playback; `play` reads the timing through
    // a ref.
  }, [src])

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      {blocked && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950/80 backdrop-blur">
          <Button className="px-8 py-5 text-lg" onClick={play}>
            ▶ Tap to play the song
          </Button>
        </div>
      )}
    </>
  )
}
