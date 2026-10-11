// EventSource and <audio> can't send headers, so the SSE and audio routes
// receive credentials in the query string. Good enough for a party game; a
// per-room cookie would be the upgrade path.
import { credentialsSchema } from '#/lib/credentials'
import type { Credentials } from '#/lib/credentials'

export function credentialsFrom(
  request: Request,
  code: string,
): Credentials | null {
  const params = new URL(request.url).searchParams
  const parsed = credentialsSchema.safeParse({
    code,
    playerId: params.get('playerId'),
    secret: params.get('secret'),
  })
  return parsed.success ? parsed.data : null
}
