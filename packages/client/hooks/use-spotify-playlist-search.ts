import { useQuery } from "react-query";

const useSpotifyPlaylistSearch = (gameId: string, query: string) => useQuery(['spotify-playlists', query], async () => {
  const response = await fetch(`http://localhost:4000/game/${gameId}/spotify/playlist?query=${encodeURI(query)}`);
  const json = await response.json();
  return json as SpotifyApi.ListOfFeaturedPlaylistsResponse;
});

export default useSpotifyPlaylistSearch;
