import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'

export async function launchBrowser() {
  const executable = [process.env.CHROME_PATH,
    process.platform === 'win32' && process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].find(candidate => candidate && existsSync(candidate))
  if (!executable) throw new Error('Chrome/Chromium not found. Install it or set CHROME_PATH to its executable. No browser was tested.')
  const output = path.resolve('test-results')
  await mkdir(output, { recursive: true })
  const profile = await mkdtemp(path.join(output, 'chrome-profile-'))
  const browser = spawn(executable, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir='+profile,
    '--no-first-run', '--no-default-browser-check', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', ...(process.env.CI ? ['--no-sandbox'] : []), 'about:blank'], { windowsHide: true, stdio: 'ignore' })
  let launchError
  browser.on('error', error => { launchError = error })
  let socket
  const pending = new Map()
  let id = 0
  const errors = [], warnings = [], badResponses = []
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id
    const timer = setTimeout(() => { pending.delete(key); reject(new Error('CDP timeout: '+method)) }, 60000)
    pending.set(key, { resolve, reject, timer })
    socket.send(JSON.stringify({ id: key, method, params }))
  })
  const close = async () => {
    if (socket?.readyState === WebSocket.OPEN) await send('Browser.close').catch(() => {})
    socket?.close()
    browser.kill()
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('Browser closed')) }
    pending.clear()
    // Delete only this run's generated profile under the resolved output root.
    if (path.dirname(profile) !== output) throw new Error('Profile cleanup escaped output directory')
    await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
  try {
    let port
    for (let attempt = 0; attempt < 100; attempt++) {
      if (launchError) throw launchError
      try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break } catch {}
      await delay(100)
    }
    if (!port) throw new Error('Chrome did not start a debugging endpoint')
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve,reject) => { socket.addEventListener('open',resolve,{once:true}); socket.addEventListener('error',reject,{once:true}) })
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.id) {
        const request = pending.get(message.id)
        if (!request) return
        pending.delete(message.id); clearTimeout(request.timer)
        if (message.error) request.reject(new Error(JSON.stringify(message.error)))
        else request.resolve(message.result)
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'warning') warnings.push(message.params.args.map(arg=>arg.value).join(' '))
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) badResponses.push(message.params.response.url)
    })
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate',{ expression, awaitPromise:true, returnByValue:true })
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
      return result.result.value
    }
    return { send, evaluate, close, errors, warnings, badResponses }
  } catch (error) { await close(); throw error }
}
