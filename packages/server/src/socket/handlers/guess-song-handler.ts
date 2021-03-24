import SocketHandler from "../socket-handler";
import { Domain, SocketClient } from "@sonq/api";
import Session from "../../models/session";
import { Logger } from "tslog";
import {
  songGuessedCorrectlyEmitter,
  songGuessedIncorrectlyEmitter,
} from "../emitters/song-guessed-emitter";

const logger = new Logger({ name: "GuessSongHandler" });

class GuessSongHandler implements SocketHandler {
  public event = SocketClient.Events.GuessSong;

  handle(session: Session) {
    return async (event: unknown, ack?: SocketClient.GuessSongAck) => {
      if (!session.player) {
        logger.error("User not signed in");
        return;
      }
      if (session.game.phase.type !== Domain.GamePhaseType.PlaySong) {
        logger.error("A guess can only be submitted while a song is running");
        return;
      }
      const guessSongEvent = SocketClient.GuessSongEventSchema.parse(event);
      const [isAnswerCorrect, songGuess] = await session.game.submitAnswer({
        ...guessSongEvent,
        player: session.player
      })
      if (isAnswerCorrect) {
        const date = new Date();
        logger.debug(
          "Player answered correctly",
          session.player.username,
          date
        );
        session.game.answers.set(session.player, date);
        songGuessedCorrectlyEmitter(session.game, session.player);
      } else {
        logger.debug("Player answered incorrectly", session.player.username);
        songGuessedIncorrectlyEmitter(session.game, session.player, songGuess)
      }
      ack?.(isAnswerCorrect);
    };
  }
}

export default GuessSongHandler;
