import { Server, Socket } from "socket.io";
import Game from "../models/game";

interface SocketHandler<D = any> {
  event: string;
  handle(game: Game, socket: Socket): (payload: D) => void | Promise<void>;
}

export default SocketHandler;
