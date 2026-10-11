import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react'
import type { GameError } from '@sonq/game'

export const ERROR_TEXT: Record<GameError, string> = {
  not_host: 'Only the host can do that.',
  wrong_phase: "That's not possible right now.",
  not_in_room: "You're not in this room (anymore).",
  room_full: 'This room is full.',
  room_not_found: "This room doesn't exist (anymore).",
  too_many_rooms: 'Too many rooms are open right now. Try again in a bit.',
  no_playlist: 'Pick a playlist first.',
  playlist_empty: 'None of the songs in this playlist have a preview.',
  playlist_not_found: "That playlist doesn't exist or isn't public.",
  too_early: 'Wait for the song to start.',
  too_late: 'Time is up for this round.',
  already_correct: 'You already got this one.',
  cooldown: 'Not so fast! Wait a moment before guessing again.',
  music_unavailable: "Deezer isn't responding. Try again in a moment.",
}
export const GENERIC_ERROR = 'Something went wrong. Please try again.'

// A player's colour, from the hue the server assigned them.
export const playerColor = (hue: number) => `oklch(0.78 0.15 ${hue})`

export function Shell({
  right,
  children,
}: {
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-neutral-950 px-4 pt-5 pb-10 text-neutral-100 antialiased">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[30vh] left-1/2 h-[min(1000px,140vw)] w-[min(1000px,140vw)] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{
          background:
            'radial-gradient(circle at 35% 40%, oklch(0.6 0.22 340 / .55), transparent 60%), radial-gradient(circle at 70% 60%, oklch(0.55 0.18 270 / .5), transparent 60%)',
        }}
      />
      <header className="relative z-10 flex w-full max-w-3xl items-center justify-between gap-3">
        <a href="/" className="font-display text-2xl font-black tracking-tight">
          sonq<span className="text-fuchsia-400">.</span>
        </a>
        {right}
      </header>
      <main className="relative z-10 mt-8 flex w-full max-w-3xl flex-1 flex-col gap-6">
        {children}
      </main>
    </div>
  )
}

const BUTTON_VARIANTS = {
  primary:
    'bg-fuchsia-500 text-white hover:bg-fuchsia-400 disabled:bg-fuchsia-500/40',
  secondary:
    'border border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10',
  ghost: 'text-neutral-400 hover:text-neutral-100',
} as const

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS
}) {
  return (
    <button
      type="button"
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base placeholder:text-neutral-500 focus:border-fuchsia-400 focus:outline-none ${className}`}
      {...props}
    />
  )
}

export function Panel({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-neutral-900/70 p-5 backdrop-blur ${className}`}
    >
      {children}
    </section>
  )
}

export function Avatar({
  name,
  hue,
  dimmed = false,
}: {
  name: string
  hue: number
  dimmed?: boolean
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-9 flex-none items-center justify-center rounded-full text-sm font-black text-neutral-950 ${dimmed ? 'opacity-40' : ''}`}
      style={{ background: playerColor(hue) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

export function Cover({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  return src ? (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`aspect-square rounded-lg object-cover ${className}`}
    />
  ) : (
    <span
      aria-hidden
      className={`aspect-square rounded-lg bg-white/10 ${className}`}
    />
  )
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-neutral-900 px-5 py-3 text-sm shadow-xl"
    >
      {children}
    </div>
  )
}
