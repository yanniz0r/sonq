import { Rest } from "@sonq/api";
import { useQuery, UseQueryOptions } from "react-query";

const useGame = (gameId: string, options?: UseQueryOptions<Rest.GetGame>) =>
  useQuery(["game", gameId], async () => {
    const response = await fetch(`http://localhost:4000/game/${gameId}`);
    const json: Rest.GetGame = await response.json();
    return json;
  }, options);

export default useGame;
