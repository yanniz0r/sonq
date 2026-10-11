import { Logger } from "tslog";
import Session from "../../models/session";
import SocketHandler from "../socket-handler";

class PlaySongHandler implements SocketHandler {
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
