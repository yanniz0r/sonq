import SocketHandler from "../socket-handler";
import { Domain, SocketClient } from "@sonq/api";
import Session from "../../models/session";
import { Logger } from "tslog";
import Game from "../../models/game";

const logger = new Logger({ name: 'ContinueHandler' })

class ContinueHandler implements SocketHandler {

  public event = SocketClient.Events.Continue;

  handle(session: Session) {
    return async () => {
      const { game } = session;
      if (game.phase.type === Domain.GamePhaseType.Lobby || game.phase.type === Domain.GamePhaseType.Summary) {
        game.resetRounds();
      }
      if (game.phase.type === Domain.GamePhaseType.Lobby || game.phase.type === Domain.GamePhaseType.Review) {
        const randomSong = await this.getRandomSong(session.game);
        if (game.hasRoundsLeft()) {
          game.transitionToPlayGame(randomSong.track); // TODO check if preview url exists
          logger.debug(`Playing song ${randomSong.track.name} from ${randomSong.track.artists[0].name} in game ${game.id}`);
        } else {
          game.transitionToSummary();
        }
      }
    }
  }

  private async getRandomSong(game: Game) {
    const tracksResponse = await game.spotify.getPlaylistTracks('49RivMoJZhGLlTz3QiEzBo');
    const { items } = tracksResponse.body
    const someTrack = items[Math.floor(Math.random() * items.length)]
    return someTrack;
  }

}

export default ContinueHandler;
