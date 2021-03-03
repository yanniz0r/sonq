const getGameUrl = (gameId: string) => {
  return `http://localhost:3000/game/${gameId}`;
}

export default getGameUrl;