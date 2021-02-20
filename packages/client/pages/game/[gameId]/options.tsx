import { useFormik } from "formik";
import { NextPage } from "next";
import { useState } from "react";
import { useQuery } from "react-query";
import * as yup from 'yup';

interface GameOptionsProps {
  gameId: string;
}

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

  const playlistsQuery = useQuery(['spotify-playlists', query], async () => {
    const response = await fetch(`http://localhost:4000/game/${gameId}/spotify/playlist?query=${encodeURI(query)}`);
    const json = await response.json();
    return json as SpotifyApi.ListOfFeaturedPlaylistsResponse;
  });

  return <div className="min-w-screen min-h-screen bg-gray-900 text-white">
      <div className="max-w-screen-lg mx-auto px-5">
        <h2 className="text-5xl pt-7">Playlist aussuchen</h2>
        <form className="flex mt-7" onSubmit={searchForm.handleSubmit}>
          <input className="flex-grow rounded-lg bg-gray-800 p-2 px-4" name="query" value={searchForm.values.query} onChange={searchForm.handleChange} />
          <button className="bg-purple-700 p-2 px-4 ml-2 rounded-lg disabled:opacity-50" disabled={!searchForm.isValid}>Suchen</button>
        </form>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-7">
          {playlistsQuery.isSuccess && playlistsQuery.data.playlists.items.map(playlist => {
            return <div className="rounded-lg overflow-hidden relative transition transform hover:scale-110" key={playlist.id}>
              <img src={playlist.images[0].url} className="w-full" />
              <div className="absolute p-2 flex items-center justify-center w-full h-full top-0 left-0 bg-white bg-opacity-90 z-10 transition opacity-0 hover:opacity-100">
                <span className="text-black font-bold text-xl text-center">{playlist.name}</span>
              </div>
            </div>
          })}
        </div>
      </div>
    </div>
}

GameOptionsPage.getInitialProps = (context) => {
  return {
    gameId: context.query.gameId as string
  }
}

export default GameOptionsPage;