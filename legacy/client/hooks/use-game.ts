import { Rest } from "@sonq/api";
import { useQuery, UseQueryOptions } from "react-query";
import getConfig from "next/config";

const config = getConfig();

export class GameNotFoundError extends Error {
  constructor(gameId: string) {
    super(`Could not find game with id ${gameId}`);
  }
}

const useGame = (gameId: string, options?: UseQueryOptions<Rest.GetGame>) =>
  useQuery(
    ["game", gameId],
    async () => {
      const response = await fetch(
        `${config.publicRuntimeConfig.serverUrl}/game/${gameId}`
      );
      if (response.status === 404) {
        throw new GameNotFoundError(gameId);
      }
      const json: Rest.GetGame = await response.json();
      return json;
    },
    options
  );

export default useGame;
