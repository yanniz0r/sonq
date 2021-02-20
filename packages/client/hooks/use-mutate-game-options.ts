import { useMutation } from "react-query";

export interface GameOptions {
  spotifyPlaylistId: string;
}

const useMutateGameOptions = (gameId: string) => useMutation(async (options: GameOptions) => {
  const response = await fetch(`http://localhost:4000/game/${gameId}/options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options),
  })
  const json = await response.json();
  return json as GameOptions;
})

export default useMutateGameOptions;