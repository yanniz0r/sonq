import SocketHandler from "../socket-handler";
import { Domain, SocketClient } from "@sonq/api";
import Session from "../../models/session";
import { Logger } from "tslog";
import Game from "../../models/game";

const logger = new Logger({ name: "ContinueHandler" });

class ContinueHandler implements SocketHandler {
  public event = SocketClient.Events.Continue;

  handle(session: Session) {
    return async () => {
      const { game, isAdmin } = session;
      if (!isAdmin) {
        logger.error("User has to be admin in order to continue the game");
        return;
      }
      if (
        game.phase.type === Domain.GamePhaseType.Lobby ||
        game.phase.type === Domain.GamePhaseType.Review
      ) {
        if (game.hasRoundsLeft()) {
          game.transitionToPlayGame();
        } else {
          game.transitionToSummary();
        }
      }else if (game.phase.type === Domain.GamePhaseType.Summary) {
        game.transitionToLobby()
      }
    };
  }
}

export default ContinueHandler;
