import dotenv from 'dotenv'
import { RedisClient, createClient } from 'redis'
import { Logger } from 'tslog'

dotenv.config()

const logger = new Logger()

const playlistTracksKey = (playlistId: string) => `spotify.playlist.tracks.${playlistId}`
const searchTracksKey = (gameId: string, query: string) => `${gameId}.spotify.search.${Buffer.from(query).toString('base64')}`

class SpotifyCache {

  private static instance: SpotifyCache
  private static loggedMissingRedis = false

  constructor(private redisClient: RedisClient) {}

  static getInstance(): SpotifyCache {
    if (!SpotifyCache.instance) {
      try {
        const redisClient = createClient()
        SpotifyCache.instance = new SpotifyCache(redisClient)
      } catch(e) {
        if (!SpotifyCache.loggedMissingRedis) {
          logger.warn('Could not get redis instance', e)
          SpotifyCache.loggedMissingRedis = true
        }
      }
    }
    return SpotifyCache.instance
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyApi.TrackObjectFull[] | null> {
    return this.redisGet(playlistTracksKey(playlistId))
  }

  setPlaylistTracks(playlistId: string, tracks: SpotifyApi.TrackObjectFull[]) {
    this.redisSet(playlistTracksKey(playlistId), tracks)
  }

  async getSearchTracks(gameId: string, query: string, ): Promise<SpotifyApi.SearchResponse | null> {
    return this.redisGet(searchTracksKey(gameId, query))
  }

  setSearchTracks(gameId: string, query: string, tracks: SpotifyApi.SearchResponse) {
    this.redisSet(searchTracksKey(gameId, query), tracks)
  }

  private redisSet(key: string, value: object, ttl = 60 * 60 * 12) {
    this.redisClient.setex(key, ttl, JSON.stringify(value))
  }

  private redisGet<T>(key: string) {
    return new Promise<T | null>((resolve, reject) => {
      this.redisClient.get(key, (error, reply) => {
        if (error) {
          reject(error)
        } else if (reply) {
          resolve(JSON.parse(reply))
        } else {
          resolve(null)
        }
      })
    })
  }

}

export default SpotifyCache
