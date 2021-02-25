import { Rest } from "@sonq/api";
import { useQuery } from "react-query";

const useGame = (gameId: string) =>
  useQuery(["game", gameId], async () => {
    const response = await fetch(`http://localhost:4000/game/${gameId}`);
    const json: Rest.GetGameDetails = await response.json();
    return json;
  });

export default useGame;
