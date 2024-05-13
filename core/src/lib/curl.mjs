import { spawn } from 'node:child_process'

export const run = (cmd, opts=[]) => new Promise((resolve) => {
  const cmd = spawn(`${cmd} ${opts.join(' ')}`)

  const data: {
    out: [],
    err: []
  }
  cmd.stdout.on('data', d => data.out.push(d))
  cmd.stderr.on('data', e => data.err.push(e))
  cmd.on('close', (code) => resolve(data))
}


