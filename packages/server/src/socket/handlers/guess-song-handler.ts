import SocketHandler from "../socket-handler";
import { Domain, SocketClient } from "@sonq/api";
import Session from "../../models/session";
import { Logger } from "tslog";

const logger = new Logger({ name: 'GuessSongHandler' })

class GuessSongHandler implements SocketHandler {

  public event = SocketClient.Events.GuessSong;

  handle(session: Session) {
    return (event: unknown) => {
      if (!session.player) {
        logger.error('User not signed in');
        return;
      }
      if (session.game.phase.type !== Domain.GamePhaseType.PlaySong) {
        logger.error('A guess can only be submitted while a song is running');
        return;
      }
      const guessSongEvent = SocketClient.GuessSongEventSchema.parse(event);
      const isAnswerCorrect = session.game.checkAnswer(guessSongEvent.songName, guessSongEvent.artistName);
      if (isAnswerCorrect) {
        const date = new Date();
        logger.debug('Player answered correctly', session.player.username, date);
        session.game.answers.set(session.player, date);
      } else {
        logger.debug('Player answered incorrectly', session.player.username);
      }
    }
  }

}

export default GuessSongHandler;
