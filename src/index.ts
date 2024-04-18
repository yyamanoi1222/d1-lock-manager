import { WorkerEntrypoint } from 'cloudflare:workers'
import { backOff, BackoffOptions } from 'exponential-backoff';

export interface Env {
  DB: D1Database
}

type LockOptions = {
  key: string
  maxLockAge?: number
  backOffOpts?: BackoffOptions
}

export default class LockManager extends WorkerEntrypoint<Env> {
  async lock({
    key,
    maxLockAge = 60, // Seconds
    backOffOpts = {}
  }: LockOptions) {
    await this.deleteExpiredLocks()

    try {
      await backOff(async () => {
        try {
          await this.env.DB.prepare('INSERT INTO lock_managers (key, expired_at) VALUES (?, ?)').bind(key, (Date.now() / 1000) + maxLockAge).run()
        } catch (e: any) {
          if (e.message.match(/UNIQUE constraint/)) {
            throw new Error('another process has lock')
          }
        }
      }, backOffOpts)
    } catch {
      throw new Error('Lock wait timeout exceeded')
    }
  }

  async withLock(opts: LockOptions, cb: Function) {
    await this.lock(opts)
    await cb()
    return this.release(opts.key)
  }

  async fetch() {
    return new Response('ok')
  }

  async release(key: string) {
    await this.env.DB.prepare('DELETE from lock_managers where key = ?').bind(key).run()
  }

  private async deleteExpiredLocks() {
    await this.env.DB.prepare('DELETE from lock_managers where expired_at <= ?').bind(Date.now() / 1000).run()
  }
}
