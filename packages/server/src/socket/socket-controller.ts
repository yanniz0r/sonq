import { Socket } from "socket.io";
import Game from "../models/game";
import SocketHandler from "./socket-handler";

class SocketController {

  constructor(
    private game: Game,
    private socket: Socket
  ) {}

  public addHandler(handler: SocketHandler) {
    this.socket.on(handler.event, (args) => {
      handler.handle(this.game, this.socket)(args)
    });
  }

}

export default SocketController;