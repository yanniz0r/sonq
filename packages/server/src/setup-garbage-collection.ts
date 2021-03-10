import GameStorage from "./storage/game-storage"

const setupGarbageCollection = (gameStorage: GameStorage) => {
  setInterval(() => {
    gameStorage.cleanup();
  }, 1 * 1000 * 60)
}

export default setupGarbageCollection;
