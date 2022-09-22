import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'

import { getInput } from '@actions/core'

const run = async (): Promise<void> => {
  const machineId = (
    getInput('machineName')
    || process.env.GITHUB_RUN_ID
    || `machine-${Date.now()}`
  ).slice(0, 20)

  await promisify(exec)(`code-server --accept-server-license-terms rename --name ${machineId}`)
  spawn('code-server', [], {
    stdio: [process.stdin, process.stdout, process.stderr]
  })
}

run()
