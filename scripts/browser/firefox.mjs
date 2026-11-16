// Optional Firefox smoke coverage via its native WebDriver BiDi endpoint.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import assert from 'node:assert/strict'
import { preview } from 'vite'

const executable=[process.env.FIREFOX_PATH, process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES,'Mozilla Firefox/firefox.exe'),'/Applications/Firefox.app/Contents/MacOS/firefox','/usr/bin/firefox'].find(p=>p&&existsSync(p))
if (!executable) throw new Error('Firefox unavailable. Install it or set FIREFOX_PATH. No Firefox test was run.')
const output=path.resolve('test-results')
await mkdir(output,{recursive:true})
const profile=await mkdtemp(path.join(output,'firefox-profile-'))
assert.equal(path.dirname(profile),output,'Generated profile remains inside the output directory')
const reservation=createServer()
await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve))
const port=reservation.address().port
await new Promise(resolve=>reservation.close(resolve))
const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}})
const base=`http://127.0.0.1:${server.httpServer.address().port}/`
const browser=spawn(executable,['--headless','--no-remote','--profile',profile,'--remote-debugging-port',String(port),'about:blank'],{windowsHide:true,stdio:'ignore'})
let launchError
browser.on('error',e=>{launchError=e})
let socket
let next=0
const pending=new Map()
const report={browser:'Firefox',scope:'Production smoke, not the Chromium regression matrix',states:[],logs:[]}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
function send(method,params={}) {
  const id=++next
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('BiDi timeout: '+method))},30000)
    pending.set(id,{resolve,reject,timer})
    socket.send(JSON.stringify({id,method,params}))
  })
}
try {
  for (let i=0;i<100;i++) {
    if(launchError) throw launchError
    try {
      socket=new WebSocket(`ws://127.0.0.1:${port}/session`)
      await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})})
      break
    } catch { await delay(100) }
  }
  if(socket?.readyState!==WebSocket.OPEN) throw new Error('Firefox BiDi unavailable')
  socket.addEventListener('message',event=>{
    const data=JSON.parse(event.data)
    if(data.id) {
      const request=pending.get(data.id)
      if(!request)return
      pending.delete(data.id);clearTimeout(request.timer)
      if(data.type==='error')request.reject(new Error(data.message))
      else request.resolve(data.result)
    }
    if(data.method==='log.entryAdded')report.logs.push(data.params)
  })
  const session=await send('session.new',{capabilities:{alwaysMatch:{browserName:'firefox'}}})
  report.version=session.capabilities.browserVersion
  await send('session.subscribe',{events:['log.entryAdded']})
  const context=(await send('browsingContext.getTree',{})).contexts[0].context
  const evaluate=async expression=>{
    const result=await send('script.evaluate',{expression:`JSON.stringify(${expression})`,target:{context},awaitPromise:true})
    if(result.type==='exception')throw new Error(JSON.stringify(result.exceptionDetails))
    return JSON.parse(result.result.value)
  }
  const waitFor=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await delay(100)}throw new Error('Firefox wait: '+expression)}
  await send('browsingContext.setViewport',{context,viewport:{width:1440,height:1000},devicePixelRatio:1})
  await send('browsingContext.navigate',{context,url:base+'#construction-inspect',wait:'complete'})
  await waitFor(`!!document.querySelector('.experience-chapter')`)
  await waitFor(`document.querySelector('.experience-scene-host')?.dataset.region==='construction'`)
  await delay(2000)
  report.webgl=await evaluate(`!!document.querySelector('canvas')?.getContext('webgl2')`)
  report.staticMode=await evaluate(`document.querySelector('.experience-chapter').dataset.staticConstruction`)
  for(const [width,height] of [[1440,1000],[390,844],[568,320]]) {
    await send('browsingContext.setViewport',{context,viewport:{width,height},devicePixelRatio:1})
    await evaluate(`(()=>{document.querySelector('#finale-composition').scrollIntoView({behavior:'instant'});return true})()`)
    await waitFor(`document.querySelector('.experience-scene-host').dataset.region==='finale'`)
    await delay(1000)
    const state=await evaluate(`({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,complete:document.querySelector('.finale-panel').dataset.complete,actionsBottom:document.querySelector('.finale-actions').getBoundingClientRect().bottom})`)
    assert(!state.overflow);assert(state.complete==='true');assert(state.actionsBottom<=height+2)
    report.states.push(state)
    const screenshot=await send('browsingContext.captureScreenshot',{context,origin:'viewport'})
    await writeFile(`test-results/firefox-${width}x${height}.png`,Buffer.from(screenshot.data,'base64'))
  }
  await evaluate(`(()=>{document.querySelector('.finale-actions a').click();return true})()`)
  await waitFor(`location.hash==='#construction-inspect'`)
  await waitFor(`document.querySelector('.experience-scene-host').dataset.region==='construction'`)
  report.primaryCta=true
  report.passed=true
} catch(error){report.failure=error.stack;console.error(error.stack);process.exitCode=1}
finally {
  await writeFile('test-results/firefox-report.json',JSON.stringify(report,null,2))
  if(socket?.readyState===WebSocket.OPEN)await send('browser.close').catch(()=>{})
  socket?.close();browser.kill()
  for(const request of pending.values()){clearTimeout(request.timer);request.reject(new Error('Firefox closed'))}
  server.httpServer.closeAllConnections()
  await new Promise(resolve=>server.httpServer.close(resolve))
  await rm(profile,{recursive:true,force:true,maxRetries:30,retryDelay:200})
}
process.exit(process.exitCode || 0)
