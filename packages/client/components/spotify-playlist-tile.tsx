import { FC } from "react";

interface SpotifyPlaylistTile {
  onClick?(): void;
  selected?: boolean;
  playlist: SpotifyApi.PlaylistBaseObject;
}

const SpotifyPlaylistTile: FC<SpotifyPlaylistTile> = ({ onClick, playlist, selected }) => {
  return <button onClick={onClick} className={`transition rounded-lg overflow-hidden relative transition transform hover:scale-110 border-green-500 ${selected ? 'border-4' : 'border-0'}`} key={playlist.id}>
    <img src={playlist.images[0].url} className="w-full" />
    <div className="absolute p-2 flex items-center justify-center w-full h-full top-0 left-0 bg-white bg-opacity-90 z-10 transition opacity-0 hover:opacity-100">
      <span className="text-black font-bold text-xl text-center">{playlist.name}</span>
    </div>
  </button>
}

export default SpotifyPlaylistTile;
