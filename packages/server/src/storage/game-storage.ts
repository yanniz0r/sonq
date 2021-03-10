import Game from "../models/game";
import dayjs from "dayjs";
import { Logger } from "tslog";

const logger = new Logger({ name: "GameStorage" });

class GameStorage {
  private games: Game[] = [];

  addGame(game: Game) {
    this.games.push(game);
  }

  getId() {
    const length = 5;
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id: string;
    let collisions = 0;
    do {
      id = '';
      while (id.length <= length) {
        id += chars[Math.floor(Math.random() * chars.length)]
      }
      logger.debug(`Generated id ${id} with ${collisions} previous collision(s)`)
      collisions++;
    } while(this.games.find(game => game.id === id))
    return id;
  }

  getGame(id: string) {
    return this.games.find((game) => game.id === id);
  }

  cleanup() {
    const now = new Date();
    logger.debug("Starting cleanup", this.games.length);
    const activeGames = this.games.filter((game) => {
      const isEmpty = game.players.length === 0;
      const isOld = dayjs(now).diff(game.createdAt, "minutes") > 10;
      return !(isEmpty && isOld);
    });
    this.games = activeGames;
    logger.debug("Finished cleanup", this.games.length);
  }
}

export default GameStorage;
