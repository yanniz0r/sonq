import { Rest } from "@sonq/api";
import { useQuery, UseQueryOptions } from "react-query";
import getConfig from 'next/config';

const config = getConfig();

const useGame = (gameId: string, options?: UseQueryOptions<Rest.GetGame>) =>
  useQuery(["game", gameId], async () => {
    const response = await fetch(`${config.serverUrl}/game/${gameId}`);
    const json: Rest.GetGame = await response.json();
    return json;
  }, options);

export default useGame;
