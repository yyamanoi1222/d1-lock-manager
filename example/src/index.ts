import type { LockManager } from '../../src/index'

export interface Env {
  LOCK_MANAGER: Service<LockManager>
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    await env.LOCK_MANAGER.withLock({ key: 'some_key' }, async () => {
      await new Promise(r => setTimeout(r, 1000))
    })
		return new Response('Hello World!');
	},
};
