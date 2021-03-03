import SocketHandler from "../socket-handler";
import Session from "../../models/session";
import { Logger } from "tslog";
import { playerLeftEmitter } from "../emitters/player-left-emitter";

const logger = new Logger({ name: "DisconnectHandler" });

class DisconnectHandler implements SocketHandler {
  public event = 'disconnect';

  handle(session: Session) {
    return () => {
      if (!session.player) {
        return;
      }
      session.game.players = session.game.players.filter(joinedPlayer => joinedPlayer !== session.player);
      logger.info(
        'Player disconnected',
        session.player
      );
      playerLeftEmitter(session.game.io, session.game, session.player);
    };
  }
}

export default DisconnectHandler;
