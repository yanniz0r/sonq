import { useQuery } from "react-query";
import getConfig from 'next/config';

const config = getConfig();

const useSpotifyPlaylistSearch = (gameId: string, query: string) =>
  useQuery(["spotify-playlists", query], async () => {
    const response = await fetch(
      `${config.publicRuntimeConfig.serverUrl}/game/${gameId}/spotify/playlist?query=${encodeURI(
        query
      )}`
    );
    const json = await response.json();
    return json as SpotifyApi.ListOfFeaturedPlaylistsResponse;
  });

export default useSpotifyPlaylistSearch;
