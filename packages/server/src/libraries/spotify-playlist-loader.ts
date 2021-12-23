import SpotifyWebApi from "spotify-web-api-node";
import { Logger } from "tslog";
import SpotifyCache from "./spotify-cache";

const logger = new Logger({ name: "SpotifyPlaylistLoader" });

class SpotifyPlaylistLoader {
  public progress = 0;

  constructor(private spotify: SpotifyWebApi) {}

  async load(playlistId: string) {
    const spotifyCache = await SpotifyCache.getInstance()
    const cachedTracks = await spotifyCache.getPlaylistTracks(playlistId)

    if (cachedTracks) {
      return cachedTracks
    }

    this.progress = 0;
    const songs: SpotifyApi.TrackObjectFull[] = [];
    const limit = 20;
    let offset = 0;
    let loaded = false;

    try {
      do {
        const playlistTracks = await this.spotify.getPlaylistTracks(
          playlistId,
          {
            limit,
            offset,
          }
        );
        if (playlistTracks.body.items.length < limit) {
          loaded = true;
        }

        for (let item of playlistTracks.body.items) {
          if (item.track.preview_url) {
            songs.push(item.track);
          }
        }

        this.progress = songs.length / playlistTracks.body.total;

        await new Promise((resolve) => setTimeout(resolve, 1000));
        logger.debug("Loaded tracks", limit, offset);
        offset += limit;
      } while (!loaded);

      const spotifyCache = await SpotifyCache.getInstance()
      await spotifyCache.setPlaylistTracks(playlistId, songs)

      return songs;
    } catch (e) {
      logger.error(
        "An error occurred while downloading playlist data",
        playlistId
      );
      throw e;
    }
  }
}

export default SpotifyPlaylistLoader;
