import { parsePlaylistId } from '@sonq/deezer'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { useRoomContext } from './RoomContext'
import { Cover, ERROR_TEXT, GENERIC_ERROR, Input } from '#/components/ui'
import { trackEvent } from '#/lib/analytics'
import { useDebounced } from '#/lib/useDebounced'
import {
  SEARCH_MIN_LENGTH,
  featuredPlaylistsFn,
  searchPlaylistsFn,
} from '#/server/music'
import { selectPlaylistFn } from '#/server/rooms'
import type { PlaylistHit } from '#/server/music.server'

// Where a pick came from, for analytics. Pasted playlists carry no title.
type Pick =
  | { id: number; source: 'featured' | 'search'; title: string }
  | { id: number; source: 'link' }

// One field for everything: empty shows Deezer's featured playlists, text
// searches, and a pasted playlist link (or id) can be used directly.
export function PlaylistPicker() {
  const { credentials, showError } = useRoomContext()
  const [input, setInput] = useState('')
  const query = useDebounced(input.trim(), 300)
  const linkedId = parsePlaylistId(input)
  const searching = linkedId === null && query.length >= SEARCH_MIN_LENGTH

  const featuredPlaylists = useServerFn(featuredPlaylistsFn)
  const searchPlaylists = useServerFn(searchPlaylistsFn)
  const selectPlaylist = useServerFn(selectPlaylistFn)

  const results = useQuery({
    queryKey: ['playlists', searching ? query : null],
    queryFn: () =>
      searching
        ? searchPlaylists({ data: { credentials, query } })
        : featuredPlaylists({ data: { credentials } }),
    staleTime: 5 * 60_000,
  })

  const select = useMutation({
    mutationFn: (pick: Pick) =>
      selectPlaylist({ data: { credentials, playlistId: pick.id } }),
    onSuccess: (result, pick) => {
      if (result.ok) {
        setInput('')
        trackEvent('playlist-select', {
          source: pick.source,
          ...(pick.source !== 'link' && { playlist: pick.title }),
        })
      } else showError(ERROR_TEXT[result.error])
    },
    onError: () => showError(GENERIC_ERROR),
  })

  const hits = results.data?.ok ? results.data.playlists : []
  const pendingId = select.isPending ? select.variables.id : null

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search playlists or paste a Deezer link"
        aria-label="Search playlists or paste a Deezer link"
      />

      {linkedId !== null ? (
        <PlaylistRow
          title={`Use playlist #${linkedId}`}
          subtitle="From your link"
          pending={pendingId === linkedId}
          disabled={select.isPending}
          onSelect={() => select.mutate({ id: linkedId, source: 'link' })}
        />
      ) : (
        <>
          <p className="text-xs tracking-widest text-neutral-500 uppercase">
            {searching ? 'Search results' : 'Featured on Deezer'}
          </p>
          {results.data && !results.data.ok && (
            <p className="text-sm text-red-300">
              {ERROR_TEXT[results.data.error]}
            </p>
          )}
          {results.isPending && (
            <p className="text-sm text-neutral-500">Loading…</p>
          )}
          {results.isSuccess && results.data.ok && hits.length === 0 && (
            <p className="text-sm text-neutral-500">No playlists found.</p>
          )}
          <ul className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
            {hits.map((hit) => (
              <li key={hit.id}>
                <PlaylistRow
                  {...rowProps(hit)}
                  pending={pendingId === hit.id}
                  disabled={select.isPending}
                  onSelect={() =>
                    select.mutate({
                      id: hit.id,
                      source: searching ? 'search' : 'featured',
                      title: hit.title,
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function rowProps(hit: PlaylistHit) {
  return {
    title: hit.title,
    cover: hit.cover,
    subtitle: [hit.owner, `${hit.trackCount} songs`]
      .filter(Boolean)
      .join(' · '),
  }
}

function PlaylistRow({
  title,
  subtitle,
  cover = '',
  pending,
  disabled,
  onSelect,
}: {
  title: string
  subtitle: string
  cover?: string
  pending: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition hover:border-fuchsia-400/60 disabled:opacity-60"
    >
      <Cover src={cover} alt="" className="size-12" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-sm text-neutral-400">
          {pending ? 'Loading songs…' : subtitle}
        </span>
      </span>
    </button>
  )
}
