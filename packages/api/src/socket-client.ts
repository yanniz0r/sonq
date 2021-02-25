import * as zod from "zod";

export enum Events {
  /**
   * A player joined the game with a username
   */
  Join = "client:join",
  /**
   * The host continues to the next game phase
   */
  Continue = "client:continue",
  /**
   * A player places a guess for a song
   */
  GuessSong = "client:guess-song",
}

export const JoinEventSchema = zod.object({
  username: zod.string(),
});
export type JoinEvent = zod.TypeOf<typeof JoinEventSchema>;

export const GuessSongEventSchema = zod.object({
  songName: zod.string(),
  artistName: zod.string(),
});
export type GuessSongEvent = zod.TypeOf<typeof GuessSongEventSchema>;
