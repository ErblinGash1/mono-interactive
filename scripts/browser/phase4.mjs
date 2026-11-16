import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { launchBrowser } from './chrome.mjs'

const base = process.env.QA_URL || 'http://127.0.0.1:5173/'
const mode = process.env.QA_MODE || 'development'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const { send, evaluate, close, errors, warnings, badResponses } = await launchBrowser()
const report = { mode, states: [], widths: [], checks: [], errors, warnings, failedResponses: badResponses }
async function waitFor(expression, label, timeout=20000) {
  const start=Date.now()
  while(Date.now()-start<timeout){if(await evaluate(expression))return;await delay(150)}
  throw new Error('Timed out: '+label)
}
try {
  async function screenshot(name) {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile('test-results/phase4-' + mode + '-' + name + '.png', Buffer.from(result.data, 'base64'))
  }
  async function click(selector) {
    const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point })
  }
  async function go(progress) {
    await evaluate(`(()=>{const r=document.querySelector('#finale').getBoundingClientRect();const h=document.querySelector('.experience-sticky').getBoundingClientRect().height;scrollTo({top:r.top+scrollY+(r.height-h)*${progress},behavior:'instant'})})()`)
    await waitFor(`Math.abs(Number(document.querySelector('.experience-scene-host').dataset.finaleProgress)-${progress})<0.0005`, 'finale pose '+progress)
    await delay(900)
  }
  async function snapshot() {
    return evaluate(`(()=>{
      const host=document.querySelector('.experience-scene-host')
      const state=window.__qaScene?.getState()
      const scene=state?.scene
      const caps=scene?.getObjectByName('Keycaps')
      const switches=scene?.getObjectByName('Switches')
      const spring=scene?.getObjectByName('Return springs')
      const canvas=document.querySelector('canvas')
      return {region:host.dataset.region,p:Number(host.dataset.finaleProgress),canvasCount:document.querySelectorAll('canvas').length,sameCanvas:window.__qaCanvas===canvas,
        camera:state?{p:state.camera.position.toArray(),q:state.camera.quaternion.toArray(),controls:state.controls.enabled}:null,
        capY:caps?.children[0].instanceMatrix.array[13],housingY:switches?.children[0].instanceMatrix.array[13],stemY:switches?.children[1].instanceMatrix.array[13],springY:spring?.instanceMatrix.array[13],springScale:spring?.instanceMatrix.array[5],
        layers:scene?['Keycaps','Switches','Plate','Foam','PCB','Battery','Case'].map(name=>scene.getObjectByName(name).position.y):null,
        complete:document.querySelector('.finale-panel').dataset.complete,overflow:document.documentElement.scrollWidth>innerWidth}
    })()`)
  }
  async function measure() {
    if (mode !== 'development') return null
    return evaluate(`new Promise(resolve=>{const state=window.__qaScene.getState();const stop=window.__qaAfterEffect(()=>{stop();resolve({render:{...state.gl.info.render},memory:{...state.gl.info.memory},dpr:state.gl.getPixelRatio()})});state.invalidate()})`)
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
  await send('Page.bringToFront'); await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: base })
  await waitFor(`document.querySelector('.product-scene')?.dataset.sceneReady==='true'`, 'keyboard ready')
  await evaluate(`(async()=>{const url=performance.getEntriesByType('resource').find(item=>item.name.includes('/deps/@react-three_fiber.js'))?.name;if(url){const api=await import(url);window.__qaAfterEffect=api.addAfterEffect;window.__qaScene=api._roots.get(document.querySelector('canvas')).store}window.__qaCanvas=document.querySelector('canvas')})()`)
  await delay(4000)
  report.hero = await measure()
  await screenshot('hero')
  console.log(mode + ': hero ready')
  const positions = [0, 0.10, 0.18, 0.35, 0.57, 0.64, 0.71, 0.78, 0.90, 0.95, 1]
  for (const progress of positions) {
    await go(progress)
    const state = await snapshot()
    assert(state.sameCanvas && state.canvasCount === 1 && !state.overflow)
    if (state.camera) assert(!state.camera.controls, 'Scroll owns the camera')
    if (progress === 0.35 && state.camera) { assert(Math.abs(state.capY - 2) < 0.001); assert(Math.abs(state.springScale - 2.4) < 0.001) }
    if (progress === 0.64 && state.camera) assert(Math.abs(state.capY + 0.13) < 0.001)
    report.states.push(state)
    if ([0.35,0.64,0.78,0.95].includes(progress)) { await screenshot('p-'+progress); state.performance = await measure() }
    console.log(mode + ': forward ' + progress)
  }
  for (const progress of [0.95, 0.78, 0.64, 0.35, 0.18, 0]) {
    await go(progress)
    const actual = await snapshot()
    const previous = report.states.find(state => Math.abs(state.p - progress) < 0.0005)
    if (actual.camera) {
      for (const key of ['p', 'q']) actual.camera[key].forEach((value, index) => assert(Math.abs(value - previous.camera[key][index]) < 0.001, 'Camera reverses'))
      for (const key of ['capY','stemY','housingY','springY','springScale']) assert(Math.abs(actual[key] - previous[key]) < 0.001, 'Signature reverses '+key)
    }
  }
  report.checks.push('forward and reverse signature, press, wave, and camera')
  await go(0.95)
  if (mode === 'development') {
    await delay(500)
    const before = await evaluate('window.__qaScene.getState().gl.info.render.frame')
    await delay(1000)
    report.idleFrames = await evaluate('window.__qaScene.getState().gl.info.render.frame') - before
    assert.equal(report.idleFrames, 0)
  }
  for (const [width,height] of [[320,568],[568,320],[320,740],[390,844],[768,1024],[844,390],[1024,800],[1440,1000],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width<900 })
    await delay(600)
    await go(0.95)
    const rects = await evaluate(`({width:innerWidth,height:innerHeight,canvas:document.querySelector('.canvas-wrap').getBoundingClientRect().toJSON(),title:document.querySelector('.finale-completion').getBoundingClientRect().toJSON(),actions:document.querySelector('.finale-actions').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth})`)
    assert(!rects.overflow, 'No page overflow '+width)
    assert(rects.actions.bottom <= height+1 && rects.actions.top >= 0, 'CTA reachable '+width+'x'+height)
    assert(rects.canvas.width > 180, 'Usable scene '+width)
    if (width<900 && width<height) { assert(rects.title.bottom < rects.canvas.top+10, 'Copy clears scene '+width); assert(rects.canvas.bottom < rects.actions.top+10, 'Scene clears CTA '+width) }
    report.widths.push(rects)
    if ([320,568,1440].includes(width)) await screenshot(width+'x'+height)
    console.log(mode + ': viewport '+width+'x'+height)
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await delay(500); await go(0.95)
  await evaluate(`document.querySelector('.finale-actions a').focus()`)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await waitFor(`location.hash==='#construction-inspect' && Math.abs(document.querySelector('#construction-inspect').getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))<3`, 'primary CTA native keyboard link')
  await waitFor(`Number(document.querySelector('.experience-scene-host').dataset.spread)===1`, 'primary CTA exploded view')
  report.exploded = await measure()
  await go(0.95)
  await click('.finale-actions a:last-child')
  await waitFor(`location.hash==='#experience' && Math.abs(document.querySelector('#experience').getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))<3`, 'back to beginning CTA')
  report.checks.push('keyboard primary CTA and secondary native anchor')
  await go(0.35)
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await waitFor(`document.querySelector('.experience-chapter').dataset.staticConstruction==='true' && document.querySelector('.experience-scene-host').dataset.region==='finale'`, 'live reduced motion retains finale')
  assert(await evaluate(`document.querySelector('#finale').getBoundingClientRect().height<=innerHeight+1 && document.querySelector('.finale-panel').dataset.complete==='true'`))
  await screenshot('reduced-motion')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await waitFor(`document.querySelector('.experience-chapter').dataset.staticConstruction==='false' && Number(document.querySelector('.experience-scene-host').dataset.finaleProgress)>0.9`, 'motion restored at composition')
  report.checks.push('live reduced motion and finale preservation')
  async function cold(hash) {
    await send('Page.navigate', { url: 'about:blank' }); await waitFor(`location.href==='about:blank'`, 'blank document')
    await send('Page.navigate', { url: base+hash })
  }
  await cold('#signature-key')
  await waitFor(`document.querySelector('.product-scene')?.dataset.sceneReady==='true' && Math.abs(Number(document.querySelector('.experience-scene-host').dataset.finaleProgress)-0.35)<0.03`, 'cold signature deep link')
  await delay(1500); await screenshot('deep-link')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await cold('#finale-composition')
  await waitFor(`document.querySelector('.experience-chapter')?.dataset.staticConstruction==='true' && document.querySelector('.finale-panel')?.dataset.complete==='true'`, 'initial reduced-motion final deep link')
  await waitFor(`Math.abs(document.querySelector('#finale').getBoundingClientRect().top)<40`, 'initial static anchor settles')
  report.checks.push('cold signature and reduced-motion composition deep links')
  console.log(mode + ': cold deep links and reduced motion passed')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await waitFor(`document.querySelector('.experience-chapter').dataset.staticConstruction==='false' && Number(document.querySelector('.experience-scene-host').dataset.finaleProgress)>0.9`, 'mode restored before mobile navigation')
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await delay(600)
  await evaluate(`scrollTo({top:0,behavior:'instant'})`)
  await waitFor('scrollY<1', 'header visible for mobile menu')
  await click('.menu-toggle')
  await waitFor(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'`, 'mobile menu opened')
  await click('nav a[href="#finale"]')
  await waitFor(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false' && location.hash==='#finale'`, 'mobile finale menu')
  await waitFor(`Math.abs(document.querySelector('#finale').getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))<3`, 'mobile finale anchor settles')
  await waitFor(`document.querySelector('nav a[href="#finale"]').getAttribute('aria-current')==='location'`, 'active finale navigation')
  report.checks.push('mobile navigation and active section')
  console.log(mode + ': mobile navigation passed')
  report.normalErrors = [...report.errors]; report.normalWarnings = [...report.warnings]
  assert.equal(report.normalErrors.length, 0)
  assert.equal(report.normalWarnings.length, 0)
  assert.equal(report.failedResponses.length, 0)
  await go(0.95)
  await evaluate(`document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`)
  await waitFor(`document.querySelectorAll('canvas').length===0 && document.querySelector('.experience-chapter').dataset.staticConstruction==='true'`, 'lost renderer removed')
  assert(await evaluate(`document.querySelector('.fallback-keyboard') && !document.querySelector('.fallback-exploded') && document.querySelector('.finale-panel').dataset.complete==='true'`))
  await screenshot('context-loss')
  await click('.finale-actions a')
  await waitFor(`!!document.querySelector('.fallback-exploded')`, 'fallback CTA still explores construction')
  report.checks.push('context loss retains final information and working CTA')
  console.log(mode + ': context loss passed')
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {apply(target,self,args){if(String(args[0]).includes('webgl'))return null;return Reflect.apply(target,self,args)}})` })
  await cold('#finale-composition')
  await waitFor(`document.querySelector('.experience-chapter')?.dataset.staticConstruction==='true' && !!document.querySelector('.fallback-keyboard')`, 'no WebGL final composition')
  assert(await evaluate(`document.querySelector('.finale-panel').dataset.complete==='true' && document.querySelector('#finale').getBoundingClientRect().height<=innerHeight+1`))
  await screenshot('no-webgl')
  await click('.finale-actions a:last-child')
  await waitFor(`location.hash==='#experience'`, 'no WebGL secondary CTA')
  report.checks.push('unavailable WebGL and final CTA')
  console.log(mode + ': unavailable WebGL passed')
  report.passed = true
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  report.failure = error.stack
  console.error(error.stack)
  process.exitCode = 1
} finally {
  await writeFile('test-results/phase4-'+mode+'-report.json', JSON.stringify(report, null, 2))
  await close()
}
