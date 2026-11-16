import { spawn } from 'node:child_process'
import { createServer, preview } from 'vite'
import { fileURLToPath } from 'node:url'

process.chdir(fileURLToPath(new URL('../../', import.meta.url)))
const modes = process.argv.includes('--production') ? ['production'] : process.argv.includes('--development') ? ['development'] : ['development','production']
const phaseArgument=process.argv.slice(2).find(arg=>arg.startsWith('--phase='))
const phases=phaseArgument?[Number(phaseArgument.slice(8))]:[3,4,5]
if(phases.some(phase=>![3,4,5].includes(phase)))throw new Error('Use --phase=3, --phase=4, or --phase=5')
for (const mode of modes) {
  const production = mode === 'production'
  const server = production
    ? await preview({ preview: { host:'127.0.0.1', port:0, open:false } })
    : await createServer({ server: { host:'127.0.0.1', port:0, open:false } })
  if (!production) await server.listen()
  const http = server.httpServer
  try {
    const url = `http://127.0.0.1:${http.address().port}/`
    for (const phase of phases) {
      console.log(`Running Phase ${phase}: ${mode} at ${url}`)
      await new Promise((resolve,reject) => {
        const child = spawn(process.execPath,[`scripts/browser/phase${phase}.mjs`],{
          env:{...process.env,QA_URL:url,QA_MODE:mode},stdio:'inherit',windowsHide:true,
        })
        child.on('error',reject)
        child.on('exit',code=>code===0?resolve():reject(new Error(`Phase ${phase} ${mode} failed (${code})`)))
      })
    }
  } finally {
    if (production) await new Promise(resolve=>http.close(resolve))
    else await server.close()
  }
}
process.exit(0)
