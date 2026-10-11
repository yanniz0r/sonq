import { FC } from "react";

interface SpotifyPlaylistTile {
  onClick?(playlistId): void;
  selected?: boolean;
  downloading?: boolean;
  playlist: any; // FIXME: Type this
}

const SpotifyPlaylistTile: FC<SpotifyPlaylistTile> = ({
  onClick,
  playlist,
  selected,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(playlist.id)}
      className={`aspect-w-1 aspect-h-1 rounded-lg overflow-hidden relative transition transform hover:scale-110 ${
        selected ? "ring-green-500 ring-4" : "ring-transparent ring-0"
      }`}
      key={playlist.id}
    >
      <img src={playlist.images[0].url} className="max-w-full" />
      <div className="absolute p-2 flex items-center justify-center w-full h-full top-0 left-0 bg-white bg-opacity-90 z-10 transition opacity-0 hover:opacity-100">
        <span className="text-black font-bold text-xl text-center">
          {playlist.name}
        </span>
      </div>
    </button>
  );
};

export default SpotifyPlaylistTile;
