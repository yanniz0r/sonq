import { Rest } from "@sonq/api";
import { useQuery, UseQueryOptions } from "react-query";

const useGame = (gameId: string, options?: UseQueryOptions<Rest.GetGameDetails>) =>
  useQuery(["game", gameId], async () => {
    const response = await fetch(`http://localhost:4000/game/${gameId}`);
    const json: Rest.GetGameDetails = await response.json();
    return json;
  }, options);

export default useGame;
