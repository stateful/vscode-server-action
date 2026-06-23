import { resolve, dirname } from 'node:path'
import { platform } from 'node:os'
import { accessSync, chmodSync, constants, existsSync } from 'node:fs'
import { execa } from 'execa'

import { download } from '@vscode/test-electron'
import { getInput } from '@actions/core'

const nodePath = resolve(process.argv[1])

const getMachineId = (): string => {
  const rawMachineId = (
    getInput('machineName')
    || process.env.GITHUB_RUN_ID
    || `machine-${Date.now()}`
  )

  const machineId = rawMachineId
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 20)

  return machineId || `machine-${Date.now()}`.slice(0, 20)
}

const getExistingPath = (...candidates: string[]): string => (
  candidates.find((candidate) => existsSync(candidate)) || candidates[0]
)

const ensureExecutable = (filePath: string): void => {
  try {
    accessSync(filePath, constants.X_OK)
    return
  } catch {
    // Continue to chmod below.
  }

  try {
    chmodSync(filePath, 0o755)
  } catch (error) {
    console.warn(`Unable to update executable permissions for ${filePath}`, error)
  }
}

const getTunnelCommand = (electronPath: string): { command: string, args: string[], executable: boolean } => {
  const currentPlatform = platform()

  if (currentPlatform === 'darwin') {
    return {
      command: getExistingPath(
        resolve(electronPath, '..', '..', 'Resources', 'app', 'bin', 'code'),
        resolve(electronPath, '..', '..', '..', '..', 'Contents', 'Resources', 'app', 'bin', 'code')
      ),
      args: ['tunnel'],
      executable: true
    }
  }

  if (currentPlatform === 'win32') {
    return {
      command: getExistingPath(
        resolve(dirname(electronPath), 'code-tunnel.exe'),
        resolve(dirname(electronPath), 'bin', 'code-tunnel.exe')
      ),
      args: ['tunnel'],
      executable: false
    }
  }

  return {
    command: resolve(dirname(electronPath), 'bin', 'code'),
    args: ['tunnel'],
    executable: true
  }
}

export const run = async (): Promise<void> => {
  /**
   * name of the machine to access
   */
  const machineId = getMachineId()

  /**
   * The time until the action continues the build of the machine
   * does not get authorised
   */
  const timeout = (
    parseInt(getInput('timeout'), 10)
    || 30 * 1000 // default 30s
  )

  /**
   * download latest VS Code
   */
  const electronPath = await download({ version: 'stable' })
  const tunnelCommand = getTunnelCommand(electronPath)
  if (tunnelCommand.executable) {
    ensureExecutable(tunnelCommand.command)
  }

  /**
   * name the machine as an individual command so that we don't
   * get prompt when launching the server
   */
  const startServer = await Promise.race([
    new Promise((resolve) => setTimeout(() => resolve(false), timeout)),
    execa(
      tunnelCommand.command,
      [...tunnelCommand.args, '--accept-server-license-terms', 'rename', machineId],
      { stdio: 'inherit' }
    ).then(() => true)
  ])

  if (!startServer) {
    console.log('Timeout reached, continuing the build')
    return process.exit(0)
  }

  await execa(tunnelCommand.command, [...tunnelCommand.args, '--accept-server-license-terms'], {
    stdio: 'inherit'
  })
}

/**
 * only run action if module is called through Node
 */
if (nodePath.endsWith('index.js')) {
  await run()
}
