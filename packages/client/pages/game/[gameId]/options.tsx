import { useFormik } from "formik";
import { NextPage } from "next";
import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import * as yup from 'yup';
import Link from 'next/link';

import SpotifyPlaylistTile from "../../../components/spotify-playlist-tile";
import useGameOptions from "../../../hooks/use-game-options";
import useMutateGameOptions from "../../../hooks/use-mutate-game-options";
import useSpotifyPlaylistSearch from "../../../hooks/use-spotify-playlist-search";
import Input, { Label } from "../../../components/input";
import { Domain } from "@sonq/api";
import { Button } from "../../../components/button";

interface GameOptionsProps {
  gameId: string;
}

const queryPresets = [
  '2000s',
  '1990s',
  '1980s',
  'rock',
  'metal',
]

const GameOptionsPage: NextPage<GameOptionsProps> = ({ gameId }) => {
  const [query, setQuery] = useState('');
  const searchForm = useFormik<{ query: string }>({
    initialValues: {
      query: ''
    },
    validationSchema: yup.object({
      query: yup.string().required().min(2)
    }),
    onSubmit(values) {
      setQuery(values.query);
    }
  })

  const mutateGameOptions = useMutateGameOptions(gameId);
  const playlistsQuery = useSpotifyPlaylistSearch(gameId, query);

  const setPlaylistIdFn = (spotifyPlaylistId: string) => () => {
    mutateGameOptions.mutate({
      spotifyPlaylistId
    });
  }

  const advancedGameOptionsForm = useFormik<Pick<Domain.GameOptions, 'rounds'>>({
    initialValues: {
      rounds: 15,
    },
    onSubmit(values) {
      mutateGameOptions.mutate(values);
    }
  });

  const gameOptionsQuery = useGameOptions(gameId);

  return <div className="min-w-screen min-h-screen bg-gray-900 text-white">
      <Link href={`/game/${gameId}`}>
        <a className="absolute left-5 top-5 text-xl">
          <FaTimes />
        </a>
      </Link>
      <div className="max-w-screen-lg mx-auto px-5">
        <h2 className="text-5xl pt-7">Playlist aussuchen</h2>
        <form className="flex mt-7" onSubmit={searchForm.handleSubmit}>
          <Input name="query" value={searchForm.values.query} onChange={searchForm.handleChange} />
          <button className="bg-purple-700 p-2 px-4 rounded-lg disabled:opacity-50 ml-2" disabled={!searchForm.isValid}>Suchen</button>
        </form>
        <ul className="mt-4">
          {queryPresets.map(preset => (
            <button className="p-2 bg-blue-400 font-bold mr-2 text-sm rounded-lg transform transition hover:scale-110" onClick={() => setQuery(preset)}>{preset}</button>
          ))}
        </ul>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-7">
          {playlistsQuery.isSuccess && playlistsQuery.data.playlists.items.map(playlist => {
            return <SpotifyPlaylistTile
              selected={playlist.id === gameOptionsQuery.data?.spotifyPlaylistId}
              onClick={setPlaylistIdFn(playlist.id)}
              playlist={playlist}
            />
          })}
        </div>

        <h2 className="text-5xl pt-7">Erweiterte Einstellungen</h2>
        <form className="mt-7" onSubmit={advancedGameOptionsForm.handleSubmit}>
          <Label>
            Rundenzahl
            <Input
              type="number"
              value={advancedGameOptionsForm.values.rounds}
              name="rounds"
              onChange={advancedGameOptionsForm.handleChange}
            />
          </Label>
          <div className="flex flex-col items-end mt-5">
            <Button type="submit">Erweiterte Einstellungen speichern</Button>
          </div>
        </form>
      </div>
    </div>
}

GameOptionsPage.getInitialProps = (context) => {
  return {
    gameId: context.query.gameId as string
  }
}

export default GameOptionsPage;