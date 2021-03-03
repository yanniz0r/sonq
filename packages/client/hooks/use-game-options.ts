import { Domain } from "@sonq/api";
import { useQuery } from "react-query";
import getConfig from 'next/config';

const config = getConfig();

const useGameOptions = (gameId: string) =>
  useQuery(["game-options", gameId], async () => {
    const response = await fetch(
      `${config.serverUrl}/game/${gameId}/options`
    );
    const json = await response.json();
    return json as Domain.GameOptions;
  });

export default useGameOptions;
