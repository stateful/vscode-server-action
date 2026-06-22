import { platform } from 'node:os'
import { resolve } from 'node:path'
import { accessSync, chmodSync, existsSync } from 'node:fs'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { getInput } from '@actions/core'
import { download } from '@vscode/test-electron'
import { execa } from 'execa'

import { run } from '../src/main'

vi.useFakeTimers()
vi.mock('node:os', async () => ({
  ...(await vi.importActual('node:os')),
  platform: vi.fn(() => 'linux')
}))
vi.mock('node:fs', async () => ({
  ...(await vi.importActual('node:fs')),
  accessSync: vi.fn(),
  chmodSync: vi.fn(),
  existsSync: vi.fn(() => true)
}))
vi.mock('@actions/core', () => ({
  getInput: vi.fn(() => '')
}))
vi.mock('@vscode/test-electron', () => ({
  download: vi.fn().mockResolvedValue('/path/to/Code')
}))
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue(undefined)
}))

const processExit = process.exit.bind(process)
const globalSetTimeout = globalThis.setTimeout

beforeEach(() => {
  vi.mocked(download).mockReset()
  vi.mocked(download).mockResolvedValue('/path/to/Code')
  vi.mocked(execa).mockReset()
  vi.mocked(execa).mockResolvedValue(undefined)
  vi.mocked(getInput).mockReset()
  vi.mocked(getInput).mockReturnValue('')
  vi.mocked(platform).mockReturnValue('linux')
  vi.mocked(accessSync).mockReset()
  vi.mocked(accessSync).mockImplementation(() => {
    throw new Error('not executable')
  })
  vi.mocked(chmodSync).mockReset()
  vi.mocked(existsSync).mockReset()
  vi.mocked(existsSync).mockReturnValue(true)
  process.exit = vi.fn()
  process.env.GITHUB_RUN_ID = '1234567890'
  // @ts-expect-error mock setTimeout
  globalThis.setTimeout = vi.fn()
})

test('continues build if timeout is reached', async () => {
  vi.mocked(execa).mockReturnValue(new Promise<never>((resolve) => {
    void resolve
  }) as ReturnType<typeof execa>)
  vi.mocked(globalThis.setTimeout).mockImplementation(((cb: () => void) => {
    cb()
    return 0
  }) as typeof setTimeout)

  const execPromise = run()

  expect(download).toBeCalledTimes(1)
  expect(await execPromise).toBe(undefined)
  expect(execa).toBeCalledTimes(1)
  expect(vi.mocked(execa).mock.calls[0][1]).toEqual([
    'tunnel',
    '--accept-server-license-terms',
    'rename',
    '1234567890'
  ])
  expect(process.exit).toBeCalledWith(0)
})

test('starts tunnel server if machine gets authorised', async () => {
  const execPromise = run()

  expect(download).toBeCalledTimes(1)
  await execPromise
  expect(execa).toBeCalledTimes(2)
  expect(vi.mocked(execa).mock.calls[0][1]).toEqual([
    'tunnel',
    '--accept-server-license-terms',
    'rename',
    '1234567890'
  ])
  expect(vi.mocked(execa).mock.calls[1][1]).toEqual([
    'tunnel',
    '--accept-server-license-terms'
  ])
  expect(vi.mocked(execa).mock.calls[1][2]).toEqual({ stdio: 'inherit' })
})

test('uses Windows VS Code tunnel executable through execa', async () => {
  vi.mocked(platform).mockReturnValue('win32')
  const executablePath = resolve('/vscode/Code.exe')
  const tunnelPath = resolve('/vscode/code-tunnel.exe')
  vi.mocked(download).mockResolvedValue(executablePath)

  await run()

  expect(vi.mocked(execa).mock.calls[0][0]).toBe(tunnelPath)
  expect(vi.mocked(execa).mock.calls[0][1]).toEqual([
    'tunnel',
    '--accept-server-license-terms',
    'rename',
    '1234567890'
  ])
  expect(vi.mocked(execa).mock.calls[0][2]).toEqual({ stdio: 'inherit' })
  expect(chmodSync).not.toHaveBeenCalled()
})

test('falls back to Windows bin tunnel executable when root executable is absent', async () => {
  vi.mocked(platform).mockReturnValue('win32')
  const executablePath = resolve('/vscode/Code.exe')
  const tunnelPath = resolve('/vscode/bin/code-tunnel.exe')
  vi.mocked(download).mockResolvedValue(executablePath)
  vi.mocked(existsSync).mockImplementation((path) => {
    return path === tunnelPath
  })

  await run()

  expect(vi.mocked(execa).mock.calls[0][0]).toBe(tunnelPath)
  expect(vi.mocked(execa).mock.calls[0][1]).toEqual([
    'tunnel',
    '--accept-server-license-terms',
    'rename',
    '1234567890'
  ])
})

test('uses flattened macOS VS Code CLI path when the app wrapper is absent', async () => {
  vi.mocked(platform).mockReturnValue('darwin')
  const executablePath = resolve('/vscode/Visual Studio Code.app/Contents/MacOS/Electron')
  const cliPath = resolve('/vscode/Contents/Resources/app/bin/code')
  vi.mocked(download).mockResolvedValue(executablePath)
  vi.mocked(existsSync).mockImplementation((path) => {
    return path === cliPath
  })

  await run()

  expect(vi.mocked(execa).mock.calls[0][0]).toBe(cliPath)
  expect(vi.mocked(execa).mock.calls[0][1]).toEqual([
    'tunnel',
    '--accept-server-license-terms',
    'rename',
    '1234567890'
  ])
  expect(chmodSync).toHaveBeenCalledWith(cliPath, 0o755)
})

test('sanitizes custom machine name before passing it to VS Code', async () => {
  vi.mocked(getInput).mockImplementation((name) => {
    return name === 'machineName'
      ? 'debug build; rm -rf /'
      : ''
  })

  await run()

  expect(vi.mocked(execa).mock.calls[0][1]).toEqual([
    'tunnel',
    '--accept-server-license-terms',
    'rename',
    'debug-build--rm--rf-'
  ])
})

afterEach(() => {
  delete process.env.GITHUB_RUN_ID
  process.exit = processExit
  globalThis.setTimeout = globalSetTimeout
})
