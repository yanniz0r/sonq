import { Track } from '@spotify/web-api-ts-sdk'
import dotenv from 'dotenv'
import { createClient, RedisClientType } from 'redis'
import { Logger } from 'tslog'

dotenv.config()

const logger = new Logger()

const playlistTracksKey = (playlistId: string) => `spotify.playlist.tracks.${playlistId}`
const searchTracksKey = (gameId: string, query: string) => `${gameId}.spotify.search.${Buffer.from(query).toString('base64')}`

class SpotifyCache {

  private static instance: SpotifyCache
  private static loggedMissingRedis = false

  constructor(private redisClient: RedisClientType<any>) {}

  static async getInstance(): Promise<SpotifyCache> {
    if (!SpotifyCache.instance) {
      try {
        const redisClient = createClient({
          url: process.env.REDIS_URL ?? 'redis://localhost:6379'
        })
        await redisClient.connect()
        SpotifyCache.instance = new SpotifyCache(redisClient as any) // FIXME: Type this
      } catch(e) {
        if (!SpotifyCache.loggedMissingRedis) {
          logger.warn('Could not get redis instance', e)
          SpotifyCache.loggedMissingRedis = true
        }
      }
    }
    return SpotifyCache.instance
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[] | null> {
    return this.redisGetJSON(playlistTracksKey(playlistId))
  }

  setPlaylistTracks(playlistId: string, tracks: Track[]) {
    return this.redisSet(playlistTracksKey(playlistId), tracks)
  }

  async getSearchTracks(gameId: string, query: string, ): Promise<any | null> {
    return this.redisGetJSON(searchTracksKey(gameId, query))
  }

  setSearchTracks(gameId: string, query: string, tracks: any[]) {
    this.redisSet(searchTracksKey(gameId, query), tracks)
  }

  private redisSet(key: string, value: object, ttl = 60 * 60 * 12) {
    this.redisClient.setEx(key, ttl, JSON.stringify(value))
  }

  private async redisGetJSON<T>(key: string): Promise<T | null> {
    const stringValue = await this.redisClient.get(key)
    if (!stringValue) return null
    return JSON.parse(stringValue) as T
  }

}

export default SpotifyCache
