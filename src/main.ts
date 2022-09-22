import { spawn } from 'node:child_process'

import { getInput } from '@actions/core'

const run = async (): Promise<void> => {
  const machineId = (
    getInput('machineName')
    || process.env.GITHUB_RUN_ID
    || `machine-${Date.now()}`
  ).slice(0, 20)

  const child = spawn(
    'code-server',
    ['--accept-server-license-terms', 'rename', '--name', machineId],
    { stdio: [process.stdin, process.stdout, process.stderr] }
  )
  await new Promise<void>((resolve, reject) => (
    child.on('exit', (exit) => exit === 0
      ? resolve()
      : reject(new Error('Failed to set machine name')))
  ))

  spawn('code-server', ['--accept-server-license-terms'], {
    stdio: [process.stdin, process.stdout, process.stderr]
  })
}

run()
