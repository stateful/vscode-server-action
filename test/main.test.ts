import { spawn } from 'node:child_process'
import { beforeEach, expect, test, vi } from 'vitest'

import { run } from '../src/main'

vi.useFakeTimers()
vi.mock('node:child_process', () => ({
  spawn: vi.fn().mockReturnValue({ on: vi.fn() })
}))

beforeEach(() => {
  vi.mocked(spawn).mockClear()
})

test('should continue build if timeout is reached', async () => {
  const execPromise = run()
  expect(vi.mocked(spawn).mock.calls[0][0]).toBe('code-server')
  expect(vi.mocked(spawn).mock.calls[0][1][1]).toBe('rename')
  vi.advanceTimersByTime(31 * 1000)
  expect(await execPromise).toBe(undefined)
  expect(spawn).toBeCalledTimes(1)
})

test('start server if machine gets authorised', async () => {
  vi.mocked(spawn).mockReturnValue({
    on: (eventName: string, cb: (exitCode: number) => void) => cb(0)
  } as any)
  const execPromise = run()
  await execPromise
  expect(spawn).toBeCalledTimes(2)
  expect(vi.mocked(spawn).mock.calls[1][0]).toBe('code-server')
  expect(vi.mocked(spawn).mock.calls[1][1].length).toBe(1)
})
