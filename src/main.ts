import { resolve, dirname } from 'node:path'
import { platform } from 'node:os'
import { spawn } from 'node:child_process'

import { download } from '@vscode/test-electron'

import { getInput } from '@actions/core'

const nodePath = resolve(process.argv[1])

export const run = async (): Promise<void> => {
  console.log('LETS GO')

  /**
   * name of the machine to access
   */
  const machineId = (
    getInput('machineName')
    || process.env.GITHUB_RUN_ID
    || `machine-${Date.now()}`
  ).slice(0, 20)
  console.log('LETS GO', 1)

  /**
   * The time until the action continues the build of the machine
   * does not get authorised
   */
  const timeout = (
    parseInt(getInput('timeout'), 10)
    || 30 * 1000 // default 30s
  )

  console.log('LETS GO', 2)
  /**
   * download latest VS Code
   */
  const electronPath = await download({ version: 'stable' })
  console.log('LETS GO', 3)
  const codePath = platform() === 'darwin'
    ? resolve(electronPath, '..', '..', 'Resources', 'app', 'bin', 'code')
    : platform() === 'win32'
      ? resolve(dirname(electronPath), 'bin', 'code.cmd')
      : resolve(dirname(electronPath), 'bin', 'code')
  console.log('LETS GO', 4)
  /**
   * name the machine as an individual command so that we don't
   * get prompt when launching the server
   */
  const child = spawn(
    codePath,
    ['tunnel', '--accept-server-license-terms', 'rename', '--name', machineId],
    { stdio: [process.stdin, process.stdout, process.stderr] }
  )

  const startServer = await new Promise<boolean>((resolve, reject) => {
    const t = setTimeout(() => resolve(false), timeout)

    child.on('exit', (exit) => {
      clearTimeout(t)
      return exit === 0
        ? resolve(true)
        : reject(new Error('Failed to set machine name'))
    })
  })

  if (!startServer) {
    console.log('Timeout reached, continuing the build')
    return process.exit(0)
  }

  spawn(codePath, ['tunnel', '--accept-server-license-terms'], {
    stdio: [process.stdin, process.stdout, process.stderr]
  })
}

/**
 * only run action if module is called through Node
 */
if (nodePath.endsWith('dist/index.js')) {
  run()
}
