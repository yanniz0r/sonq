import SpotifyWebApi from "spotify-web-api-node";
import { Logger } from "tslog";
import { playerJoinedEmitter } from "../socket/emitters/player-joined-emitter";

const logger = new Logger({ name: 'SpotifyPlaylistLoader' });

class SpotifyPlaylistLoader {

  public songs: SpotifyApi.TrackObjectFull[] = [];

  public loaded = false;

  constructor(
    private spotify: SpotifyWebApi,
    private playlistId: string
  ) { }

  async load() {
    let offset = 0;
    const limit = 20;

    try {
      do {
        const playlistTracks = await this.spotify.getPlaylistTracks(this.playlistId, {
          limit,
          offset,
        })
        if (playlistTracks.body.items.length < limit) {
          this.loaded = true;
        }

        for (let item of playlistTracks.body.items) {
          if (item.track.preview_url) {
            this.songs.push(item.track);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        logger.debug('Loaded tracks', limit,  offset);
        offset += limit;
      } while(!this.loaded)
    } catch (e) {
      logger.error('An error occurred')
    }
  }

}

export default SpotifyPlaylistLoader;