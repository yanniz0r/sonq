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
      const playerIndex = session.game.players.indexOf(session.player);
      if (playerIndex === -1) {
        logger.error('The player is not assigned to the game')
        return;
      }
      session.game.players = session.game.players.splice(playerIndex, 1);
      logger.info(
        'Player disconnected',
        session.player
      );
      playerLeftEmitter(session.game.io, session.game, session.player);
    };
  }
}

export default DisconnectHandler;
