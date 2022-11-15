import { spawn } from 'node:child_process'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { run } from '../src/main'

vi.useFakeTimers()
vi.mock('node:child_process', () => ({
  spawn: vi.fn().mockReturnValue({ on: vi.fn() })
}))

const processExit = process.exit.bind(process)
beforeEach(() => {
  vi.mocked(spawn).mockClear()
  process.exit = vi.fn()
})

test('should continue build if timeout is reached', async () => {
  const execPromise = run()
  expect(vi.mocked(spawn).mock.calls[0][0]).toBe('code-server')
  expect(vi.mocked(spawn).mock.calls[0][1][1]).toBe('rename')
  vi.advanceTimersByTime(31 * 1000)
  expect(await execPromise).toBe(undefined)
  expect(spawn).toBeCalledTimes(1)
  expect(process.exit).toBeCalledWith(0)
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

afterEach(() => {
  process.exit = processExit
})
