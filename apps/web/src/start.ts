import { gameErrorSchema } from '@sonq/game'
import { createMiddleware, createStart } from '@tanstack/react-start'
import { z } from 'zod'

import { createLogger } from '#/server/log.server'

// What a server function's `Result` looks like when it failed.
const failedResultSchema = z.object({
  result: z.object({ ok: z.literal(false), error: gameErrorSchema }),
})

// Logs every server function call: name, duration, and how it ended (`ok`,
// a game error from its `Result`, or a throw, which includes input that
// failed validation).
const logServerFunctions = createMiddleware({ type: 'function' }).server(
  async ({ next, serverFnMeta }) => {
    // Created here, not at module level: this file is part of the client
    // bundle too, and only the `.server()` body is stripped from it.
    const log = createLogger('fn')
    const started = performance.now()
    const ms = () => Math.round(performance.now() - started)
    try {
      const ctx = await next()
      const failed = failedResultSchema.safeParse(ctx)
      log.debug('call', {
        fn: serverFnMeta.name,
        ms: ms(),
        result: failed.success ? failed.data.result.error : 'ok',
      })
      return ctx
    } catch (error) {
      log.warn('call failed', {
        fn: serverFnMeta.name,
        ms: ms(),
        error: (error instanceof Error ? error.message : String(error)).slice(
          0,
          300,
        ),
      })
      throw error
    }
  },
)

export const startInstance = createStart(() => ({
  functionMiddleware: [logServerFunctions],
}))
