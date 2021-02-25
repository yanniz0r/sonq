import { Socket } from "socket.io";
import SpotifyWebApi from "spotify-web-api-node";
import { Logger } from "tslog";
import Game from "../../models/game";
import Session from "../../models/session";
import SocketHandler from "../socket-handler";

const logger = new Logger({ name: "PlaySongHandler" });

class PlaySongHandler implements SocketHandler {
  constructor(private spotify: SpotifyWebApi) {}

  public event = "play-next-song";

  handle(session: Session) {
    return async () => {
      const tracksResponse = await session.game.spotify.getPlaylistTracks(
        "49RivMoJZhGLlTz3QiEzBo"
      );
      const someTrack = tracksResponse.body.items[0].track;
      const url = someTrack.preview_url;
      session.socket.emit("play-song", {
        url,
      });
    };
  }
}

export default PlaySongHandler;
