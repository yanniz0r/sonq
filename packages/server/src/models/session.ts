import { Socket } from "socket.io";
import Game from "./game";
import Player from "./player";

class Session {
  public player?: Player;

  constructor(public game: Game, public socket: Socket, public isAdmin: boolean) {}
}

export default Session;
