import { useMutation } from "react-query";
import { Domain } from "@sonq/api";
import queryClient from "../config/query-client";
import getConfig from "next/config";
import { ADMINKEY } from "../constants/local-storage";

const config = getConfig()

const useMutateGameOptions = (gameId: string) =>
  useMutation(
    async (options: Domain.GameOptions) => {
      const response = await fetch(
        `${config.publicRuntimeConfig.serverUrl}/game/${gameId}/options`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem(ADMINKEY(gameId))}`,
          },
          body: JSON.stringify(options),
        }
      );
      const json = await response.json();
      return json as Domain.GameOptions;
    },
    {
      onSuccess() {
        queryClient.refetchQueries({
          queryKey: ["game-options", gameId],
        });
      },
    }
  );

export default useMutateGameOptions;
