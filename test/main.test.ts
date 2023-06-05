import { spawn } from 'node:child_process'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { download } from '@vscode/test-electron'

import { run } from '../src/main'

vi.useFakeTimers()
vi.mock('node:child_process', () => ({
  spawn: vi.fn().mockReturnValue({ on: vi.fn() })
}))
vi.mock('@vscode/test-electron', () => ({
  download: vi.fn().mockReturnValue('/path/to/code')
}))

const processExit = process.exit.bind(process)
const globalSetTimeout = globalThis.setTimeout
beforeEach(() => {
  vi.mocked(spawn).mockClear()
  vi.mocked(download).mockClear()
  process.exit = vi.fn()
  // @ts-expect-error mock setTimeout
  globalThis.setTimeout = vi.fn((cb) => cb())
})

test('should continue build if timeout is reached', async () => {
  const execPromise = run()
  expect(download).toBeCalledTimes(1)
  expect(await execPromise).toBe(undefined)
  expect(vi.mocked(spawn).mock.calls[0][1][0]).toBe('tunnel')
  expect(vi.mocked(spawn).mock.calls[0][1][2]).toBe('rename')
  expect(spawn).toBeCalledTimes(1)
  expect(process.exit).toBeCalledWith(0)
})

test('start server if machine gets authorised', async () => {
  vi.mocked(spawn).mockReturnValue({
    on: (eventName: string, cb: (exitCode: number) => void) => cb(0)
  } as any)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  vi.mocked(globalThis.setTimeout).mockImplementation(((cb) => {}) as any)
  const execPromise = run()
  expect(download).toBeCalledTimes(1)
  await execPromise
  expect(spawn).toBeCalledTimes(2)
  expect(vi.mocked(spawn).mock.calls[1][1][0]).toBe('tunnel')
  expect(vi.mocked(spawn).mock.calls[1][1].length).toBe(2)
})

afterEach(() => {
  process.exit = processExit
  globalThis.setTimeout = globalSetTimeout
})
