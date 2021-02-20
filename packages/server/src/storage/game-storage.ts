import Game from "../models/game";
import { v4 } from 'uuid';

class GameStorage {

  private games: Game[] = [];

  addGame(game: Game) {
    this.games.push(game);
  }

  getId() {
    return v4();
  }

  getGame(id: string) {
    return this.games.find((game) => game.id === id);
  }

}

export default GameStorage;
