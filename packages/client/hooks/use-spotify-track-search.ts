import { useQuery } from "react-query";

const useSpotifyTrackSearch = (gameId: string, query: string) =>
  useQuery(
    ["spotify-tracks", query],
    async () => {
      const response = await fetch(
        `http://localhost:4000/game/${gameId}/spotify/track?query=${query}`
      );
      const json = await response.json();
      return json as SpotifyApi.SearchResponse;
    },
    {
      enabled: query.length >= 2,
    }
  );

export default useSpotifyTrackSearch;
