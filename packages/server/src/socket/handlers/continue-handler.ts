import SocketHandler from "../socket-handler";
import { Domain, SocketClient } from "@sonq/api";
import Session from "../../models/session";
import { Logger } from "tslog";
import { phaseChangeEmitter } from "../emitters/phase-change-emitter";
import dayjs from 'dayjs';
import Game from "../../models/game";

const logger = new Logger({ name: 'ContinueHandler' })

const PRE_SONG_DELAY = 5 * 1000;
const PLAY_SONG_TIME = 30 * 1000;

class ContinueHandler implements SocketHandler {

  public event = SocketClient.Events.Continue;

  handle(session: Session) {
    return async () => {
      const { game, socket } = session;
      if (game.phase.type === Domain.GamePhaseType.Lobby || game.phase.type === Domain.GamePhaseType.Review) {
        const randomSong = await this.getRandomSong(session.game);
        const phaseStartDate = dayjs(new Date()).add(PRE_SONG_DELAY, 'ms');
        const phaseEndDate = dayjs(phaseStartDate).add(PLAY_SONG_TIME, 'ms');
        game.phase = {
          type: Domain.GamePhaseType.PlaySong,
          data: {
            phaseEndDate: phaseEndDate.toISOString(),
            phaseStartDate: phaseStartDate.toISOString(),
            previewUrl: randomSong.track.preview_url!, // TODO ensure we have a url
          }
        };
        logger.debug(`Playing song ${randomSong.track.name} from ${randomSong.track.artists[0].name} in game ${game.id}`);
        game.currentSong = randomSong.track;

        const timeout = setTimeout(() => {
          game.phase = {
            type: Domain.GamePhaseType.Review,
            data: {
              answers: game.getReviewAnswers(),
              track: game.currentSong!,
            }
          };
        }, PRE_SONG_DELAY + PLAY_SONG_TIME);
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
