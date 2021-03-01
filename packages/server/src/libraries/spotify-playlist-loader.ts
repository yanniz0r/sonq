import SpotifyWebApi from "spotify-web-api-node";
import { Logger } from "tslog";

const logger = new Logger({ name: 'SpotifyPlaylistLoader' });

class SpotifyPlaylistLoader {

  public progress = 0;

  constructor(
    private spotify: SpotifyWebApi
  ) { }

  async load(playlistId: string) {
    this.progress = 0;
    const songs: SpotifyApi.TrackObjectFull[] = [];
    const limit = 20;
    let offset = 0;
    let loaded = false;

    try {
      do {
        const playlistTracks = await this.spotify.getPlaylistTracks(playlistId, {
          limit,
          offset,
        })
        if (playlistTracks.body.items.length < limit) {
          loaded = true;
        }

        for (let item of playlistTracks.body.items) {
          if (item.track.preview_url) {
            songs.push(item.track);
          }
        }

        this.progress = songs.length / playlistTracks.body.total

        await new Promise((resolve) => setTimeout(resolve, 2000));
        logger.debug('Loaded tracks', limit,  offset);
        offset += limit;
      } while(!loaded)
      return songs;
    } catch (e) {
      logger.error('An error occurred while downloading playlist data', playlistId)
      throw e;
    }
  }

}

export default SpotifyPlaylistLoader;