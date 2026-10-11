import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import useSpotifyPlaylistSearch from "../hooks/use-spotify-playlist-search";
import Input from "./input";
import SpotifyPlaylistTile from "./spotify-playlist-tile";
import {useTranslation} from "react-i18next"
import { debounce } from "lodash";

interface PlaylistSelectionProps {
  gameId: string;
  selectedPlaylist?: string;
  onSelect(playlistId: string): void;
}

const queryPresets = [
  "2000s",
  "1990s",
  "1980s",
  "rock",
  "metal",
  "copyright free",
];


const PlaylistSelection: FC<PlaylistSelectionProps> = ({ gameId, onSelect, selectedPlaylist }) => {
  const {t} = useTranslation('gameOptions')
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSetSearchQuery = useMemo(() => debounce(setSearchQuery, 750), [setSearchQuery]);
  const playlistsQuery = useSpotifyPlaylistSearch(gameId, searchQuery);

  const onChange = useCallback((event: FormEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value)
  }, [])

  useEffect(() => {
    debouncedSetSearchQuery(query)
  }, [query])

  const skeleton = []
  for (let i = 0; i < 12; i++) {
    skeleton.push(<div key={i} className="aspect-w-1 aspect-h-1 animate-pulse bg-white bg-opacity-10 rounded-lg" />)
  }

  console.log(playlistsQuery.data)

  return <>
    <div className="flex mt-7">
      <Input
        name="query"
        placeholder={t('searchPlaylistPlaceholder')}
        value={query}
        onChange={onChange}
      />
    </div>
    <ul className="mt-4">
      {queryPresets.map((preset) => (
        <button
          key={preset}
          type="button"
          className="p-2 bg-blue-400 font-bold mr-2 mb-2 text-sm rounded-lg transform transition hover:scale-110"
          onClick={() => {
            setQuery(preset);
            setSearchQuery(preset);
          }}
        >
          {preset}
        </button>
      ))}
    </ul>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-7">
      {playlistsQuery.isLoading && skeleton}
      {playlistsQuery.isSuccess &&
        playlistsQuery.data.map((playlist) => {
          return (
            <SpotifyPlaylistTile
              key={playlist.id}
              selected={
                playlist.id === selectedPlaylist
              }
              onClick={onSelect}
              playlist={playlist}
            />
          );
        })}
    </div>
  </>
}


export default PlaylistSelection