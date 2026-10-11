import { PLAYER_NAME_MAX, playerNameSchema } from '@sonq/game'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { Button, Input } from '#/components/ui'
import { loadName, saveName } from '#/lib/session'

// Asks for a player name (remembered for next time) before an action.
export function NameForm({
  submitLabel,
  pending,
  onSubmit,
  children,
}: {
  submitLabel: string
  pending: boolean
  onSubmit: (name: string) => void
  children?: ReactNode
}) {
  const [name, setName] = useState(loadName)
  const parsed = playerNameSchema.safeParse(name)

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!parsed.success) return
        saveName(parsed.data)
        onSubmit(parsed.data)
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={PLAYER_NAME_MAX}
        placeholder="Your name"
        aria-label="Your name"
        autoComplete="nickname"
      />
      {children}
      <Button
        type="submit"
        className="py-3 text-base"
        disabled={!parsed.success || pending}
      >
        {submitLabel}
      </Button>
    </form>
  )
}
