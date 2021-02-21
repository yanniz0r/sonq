import { Domain } from "@sonq/api";
import { useQuery } from "react-query";

const useGameOptions = (gameId: string) => useQuery(['game-options', gameId], async () => {
  const response = await fetch(`http://localhost:4000/game/${gameId}/options`);
  const json = await response.json();
  return json as Domain.GameOptions;
});

export default useGameOptions;
