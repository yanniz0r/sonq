import * as zod from 'zod';

export const GameOptionsSchema = zod.object({
  spotifyPlaylistId: zod.string().optional()
})

export type GameOptions = zod.TypeOf<typeof GameOptionsSchema>;

export interface Player {
  username: string;
}