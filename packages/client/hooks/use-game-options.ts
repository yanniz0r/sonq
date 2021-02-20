import { useQuery } from "react-query";
import { GameOptions } from './use-mutate-game-options';

const useGameOptions = (gameId: string) => useQuery(['game-options', gameId], async () => {
  const response = await fetch(`http://localhost:4000/game/${gameId}/options`);
  const json = await response.json();
  return json as GameOptions;
});

export default useGameOptions;
