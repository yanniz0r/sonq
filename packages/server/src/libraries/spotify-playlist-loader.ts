import { Logger } from "tslog";
import SpotifyCache from "./spotify-cache";
import { SpotifyApi, Track } from "@spotify/web-api-ts-sdk";

const logger = new Logger({ name: "SpotifyPlaylistLoader" });

class SpotifyPlaylistLoader {
  public progress = 0;

  constructor(private spotify: SpotifyApi) {}

  async load(playlistId: string) {
    const spotifyCache = await SpotifyCache.getInstance()
    const cachedTracks = await spotifyCache.getPlaylistTracks(playlistId)

    if (cachedTracks) {
      return cachedTracks
    }

    this.progress = 0;
    const songs: Track[] = [];
    const limit = 20;
    let offset = 0;
    let loaded = false;

    try {
      do {
        const playlistTracks = await this.spotify.playlists.getPlaylistItems(
          playlistId,
          undefined,
          undefined,
          limit,
          offset,
        );
        if (playlistTracks.items.length < limit) {
          loaded = true;
        }

        for (let item of playlistTracks.items) {
          if (item.track.preview_url) {
            songs.push(item.track);
          }
        }

        this.progress = songs.length / playlistTracks.total;

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
