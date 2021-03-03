import { useQuery } from "react-query";
import getConfig from 'next/config';

const config = getConfig();

const useSpotifyTrackSearch = (gameId: string, query: string) =>
  useQuery(
    ["spotify-tracks", query],
    async () => {
      const response = await fetch(
        `${config.serverUrl}/game/${gameId}/spotify/track?query=${query}`
      );
      const json = await response.json();
      return json as SpotifyApi.SearchResponse;
    },
    {
      enabled: query.length >= 2,
    }
  );

export default useSpotifyTrackSearch;
