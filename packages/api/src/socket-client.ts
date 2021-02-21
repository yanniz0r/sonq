import * as zod from 'zod';

export enum Events {
  Join = 'client:join'
}

export const JoinEventSchema = zod.object({
  username: zod.string()
})
export type JoinEvent = zod.TypeOf<typeof JoinEventSchema>;
