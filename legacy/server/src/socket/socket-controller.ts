import { Socket } from "socket.io";
import Game from "../models/game";
import Session from "../models/session";
import SocketHandler from "./socket-handler";

class SocketController {
  private session: Session;

  constructor(game: Game, private socket: Socket, isAdmin: boolean) {
    this.session = new Session(game, socket, isAdmin);
  }

  public addHandler(handler: SocketHandler) {
    this.socket.on(handler.event, (args, ack) => {
      handler.handle(this.session)(args, ack);
    });
  }
}

export default SocketController;
