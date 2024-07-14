import { Logger } from "tslog";
import Session from "../../models/session";
import SocketHandler from "../socket-handler";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const logger = new Logger({ name: "PlaySongHandler" });

class PlaySongHandler implements SocketHandler {
  constructor(private spotify: SpotifyApi) {}

  public event = "play-next-song";

  handle(session: Session) {
    return async () => {
      const tracksResponse = await session.game.spotify!.playlists.getPlaylistItems(
        "49RivMoJZhGLlTz3QiEzBo"
      );
      const someTrack = tracksResponse.items[0].track;
      const url = someTrack.preview_url;
      session.socket.emit("play-song", {
        url,
      });
    };
  }
}

export default PlaySongHandler;
