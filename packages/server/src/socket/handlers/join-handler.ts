import SocketHandler from "../socket-handler";
import { SocketClient } from "@sonq/api";
import Session from "../../models/session";
import { Logger } from "tslog";
import Player from "../../models/player";

const logger = new Logger({ name: 'JoinHandler' })

class JoinHandler implements SocketHandler {

  public event = SocketClient.Events.Join;

  handle(session: Session) {
    return (event: unknown) => {
      const joinEvent = SocketClient.JoinEventSchema.parse(event)
      if (session.player) {
        logger.error('Player already joined', joinEvent);
        return;
      }
      session.player = new Player(joinEvent.username);
      logger.info(`Player ${session.player.username} joined the game ${session.game.id}`);
    }
  }

}

export default JoinHandler;
