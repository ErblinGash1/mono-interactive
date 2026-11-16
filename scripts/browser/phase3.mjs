import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { launchBrowser } from './chrome.mjs'

const base = process.env.QA_URL || 'http://127.0.0.1:5173/'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const { send, evaluate, close, errors, warnings, badResponses } = await launchBrowser()
try {
  async function screenshot(name) {
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await writeFile('test-results/phase3-' + name + '.png', Buffer.from(data, 'base64'))
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.bringToFront')
  await send('Emulation.setFocusEmulationEnabled',{enabled:true})
  await send('Network.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: base })
  const waitFor = async (expression, label, timeout = 15000) => {
    const started = Date.now()
    while (Date.now() - started < timeout) {
      if (await evaluate(expression)) return
      await delay(150)
    }
    const diagnostic=await evaluate(`({scroll:scrollY,hash:location.hash,mode:document.querySelector('.experience-chapter')?.dataset.staticConstruction,progress:document.querySelector('.experience-scene-host')?.dataset.progress,story:document.querySelector('#construction')?.getBoundingClientRect().toJSON()})`)
    throw new Error('Timed out: ' + label+' '+JSON.stringify(diagnostic))
  }
  await waitFor('document.querySelector(".product-scene")?.dataset.sceneReady === "true"', 'keyboard ready')
  const initial = await evaluate(`(async () => {
    const url = performance.getEntriesByType('resource').find(item => item.name.includes('/deps/@react-three_fiber.js'))?.name
    if (url) {
      const { _roots } = await import(url)
      const api = await import(url)
      window.__qaAfterEffect = api.addAfterEffect
      window.__qaScene = _roots.get(document.querySelector('canvas')).store
    }
    window.__qaCanvas = document.querySelector('canvas')
    return { webgl: !!window.__qaCanvas.getContext('webgl2'), dev: !!url }
  })()`)
  assert(initial.webgl, 'A real WebGL2 context renders the keyboard')
  await delay(4500)
  if (initial.dev) await waitFor('window.__qaScene.getState().controls?.enabled', 'hero reveal completed')
  await screenshot('hero')
  async function go(progress) {
    await evaluate(`(() => {
      const story = document.querySelector('#construction').getBoundingClientRect()
      const h = document.querySelector('.experience-sticky').getBoundingClientRect().height
      const top = story.top + scrollY
      const start = Math.max(0, top - h)
      const end = top + story.height - h
      window.scrollTo({top: start + (end-start)*${progress}, behavior:'instant'})
    })()`)
    await waitFor('Math.abs(Number(document.querySelector(".experience-scene-host").dataset.progress)-' + progress + ') < 0.0005', 'scroll progress '+progress)
    if (initial.dev) await waitFor(`Math.abs(window.__qaScene.getState().scene.getObjectByName('Keycaps').position.y-(0.51+5.8*Number(document.querySelector('.experience-scene-host').dataset.spread)))<0.001`, 'rendered layer state')
    await delay(350)
    if (initial.dev) {
      await waitFor(`(()=>{const s=window.__qaScene.getState().size;const r=document.querySelector('.canvas-wrap').getBoundingClientRect();return Math.abs(s.width-r.width)<1&&Math.abs(s.height-r.height)<1})()`, 'canvas resize committed')
      await measureFrame()
    }
    // The RO-driven camera fit and the projected leaders must finish together.
    if (progress > 0.58 && progress < 0.82 && initial.dev) {
      await waitFor('document.querySelector(".component-callouts")?.dataset.projected === "true"', 'projected labels')
    }
  }
  async function measureFrame() {
    if (!initial.dev) return null
    return evaluate(`new Promise(resolve=>{
      const state=window.__qaScene.getState()
      const stop=window.__qaAfterEffect(()=>{
        stop()
        resolve({render:{...state.gl.info.render},memory:{...state.gl.info.memory},dpr:state.gl.getPixelRatio()})
      })
      state.invalidate()
    })`)
  }
  async function click(selector){
    const point=await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});const r=element.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point})
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point})
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point})
  }
  async function snapshot() {
    return evaluate(`(() => {
      const host = document.querySelector('.experience-scene-host')
      const callouts = document.querySelector('.component-callouts')
      const result = {
        canvasCount: document.querySelectorAll('canvas').length,
        sameCanvas: window.__qaCanvas === document.querySelector('canvas'),
        host: host.getBoundingClientRect().toJSON(),
        exploring: host.dataset.exploring,
        projected: callouts.dataset.projected,
        labels: [...callouts.querySelectorAll('button')].map(item=>({text:item.textContent,rect:item.getBoundingClientRect().toJSON()})),
        lines: [...callouts.querySelectorAll('path')].map(item=>item.getAttribute('d')),
        overflow: document.documentElement.scrollWidth > innerWidth,
        active: document.querySelector('nav [aria-current]')?.getAttribute('href')
      }
      if (window.__qaScene) {
        const state=window.__qaScene.getState()
        result.layers = ['Keycaps','Switches','Plate','Foam','PCB','Battery','Case'].map(name=>state.scene.getObjectByName(name).position.y)
        result.camera=state.camera.position.toArray()
        result.render={...state.gl.info.render}
        result.memory={...state.gl.info.memory}
        result.orbitEnabled=state.controls.enabled
        result.hover=state.scene.getObjectByName('MONO M-01 keyboard').rotation.toArray().slice(0,3)
      }
      return result
    })()`)
  }
  const report = { initial, stages: [] }
  report.heroPerformance=await measureFrame()
  for (const progress of [0,0.14,0.24,0.43,0.67,0.94,1]) {
    await go(progress)
    const data=await snapshot()
    assert.equal(data.canvasCount,1)
    assert(data.sameCanvas, 'The original canvas persists through the chapter')
    assert(!data.overflow, 'No page overflow')
    report.stages.push({progress,...data})
    if ([0.24,0.43,0.67,1].includes(progress)) await screenshot('p-'+progress)
  }
  const held=report.stages.find(item=>item.progress===0.67)
  if (initial.dev) {
    assert(held.layers[0]-held.layers[6]>9, 'All seven layers actually separate')
    assert.equal(held.orbitEnabled,false)
  }
  for (const progress of [0.67,0.43,0]) {
    await go(progress)
    const reverse=await snapshot()
    const forward=report.stages.find(item=>item.progress===progress)
    if (initial.dev && progress>0) {
      forward.layers.forEach((value,index)=>assert(Math.abs(value-reverse.layers[index])<0.002, 'Layer reversal is deterministic'))
      forward.camera.forEach((value,index)=>assert(Math.abs(value-reverse.camera[index])<0.03, 'Camera reversal is deterministic'))
    }
  }
  await go(0.67)
  await evaluate('document.querySelectorAll(".component-callouts button")[4].click()')
  assert.equal(await evaluate('document.querySelector(".layer-readout h3").textContent'),'PCB & electronics')
  if (initial.dev) {
    report.explodedPerformance=await measureFrame()
    await delay(500)
    const idle=await evaluate('window.__qaScene.getState().gl.info.render.frame')
    await delay(700)
    assert.equal(await evaluate('window.__qaScene.getState().gl.info.render.frame'),idle,'Held view does not render continuously')
    report.idleFrames=await evaluate('window.__qaScene.getState().gl.info.render.frame')-idle
  }
  const widths=[]
  for (const [width,height] of [[320,740],[390,844],[768,1024],[844,390],[1024,800],[1440,1000],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900})
    await delay(500)
    await go(0.67)
    const data=await snapshot()
    assert(!data.overflow, 'Responsive page fits width '+width)
    assert(data.host.left>=-1 && data.host.right<=width+1, 'Stage stays in the viewport')
    const lastLink=await evaluate('document.querySelector(".construction-links a:last-child").getBoundingClientRect().bottom')
    assert(lastLink<=height+1,'Construction controls fit the viewport at '+width+'x'+height)
    widths.push({width,height,host:data.host})
    if (width===390) {
      await screenshot('mobile-exploded')
      await evaluate('document.querySelectorAll(".layer-picker button")[5].click()')
      assert.equal(await evaluate('document.querySelector(".layer-readout h3").textContent'),'Battery modules')
      assert.equal(await evaluate('getComputedStyle(document.querySelector(".component-callouts")).display'),'none')
    }
  }
  report.widths=widths
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  await delay(500)
  await go(0.67)
  await screenshot('exploded')
  await writeFile('test-results/phase3-checkpoint.json',JSON.stringify(report,null,2))
  console.log('Core checks passed:',JSON.stringify({hero:report.heroPerformance,exploded:report.explodedPerformance,idleFrames:report.idleFrames}))
  report.extra=[]
  // Keyboard controls must remain usable without changing the scroll coordinate.
  const keyboardScroll=await evaluate('scrollY')
  await evaluate('document.querySelectorAll(".component-callouts button")[3].focus({preventScroll:true})')
  const focus=await evaluate(`({inert:document.querySelector('.component-callouts').inert,display:getComputedStyle(document.querySelector('.component-callouts')).display,focused:document.activeElement===document.querySelectorAll('.component-callouts button')[3]})`)
  assert(focus.focused,'Callout is keyboard focusable: '+JSON.stringify(focus))
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'})
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
  await waitFor('document.querySelector(".layer-readout h3").textContent==="Acoustic foam"','keyboard activation')
  assert(Math.abs(await evaluate('scrollY')-keyboardScroll)<2)
  report.extra.push('Keyboard callout selection')
  // Ownership handoffs should be continuous at the hero boundary.
  if(initial.dev){
    await go(0.001)
    const near=await snapshot()
    await go(0)
    const home=await snapshot()
    assert(Math.hypot(...home.camera.map((value,index)=>value-near.camera[index]))<0.25,'No camera jump at hero handoff')
    assert.equal(home.orbitEnabled,true)
    report.extra.push('Camera ownership boundary')
  }
  await go(0.43)
  await click('.construction-links a[href="#construction-inspect"]')
  await waitFor('Math.abs(document.querySelector("#construction-inspect").getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))<3','native inspection anchor position')
  await waitFor('Number(document.querySelector(".experience-scene-host").dataset.progress)>0.58 && Number(document.querySelector(".experience-scene-host").dataset.progress)<0.83','inspection pose after native anchor')
  await waitFor('document.querySelector("nav [aria-current]")?.getAttribute("href")==="#construction"','active construction navigation')
  assert.equal(await evaluate('location.hash'),'#construction-inspect')
  report.extra.push('Inspection anchor and active navigation')
  await go(0.67)
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await waitFor('document.querySelector(".experience-chapter").dataset.staticConstruction==="true"','reduced motion enabled')
  await waitFor('Math.abs(Number(document.querySelector(".experience-scene-host").dataset.progress)-0.67)<0.001','static exploded pose')
  await waitFor('document.querySelector("#construction").getBoundingClientRect().height<=innerHeight+1','static construction layout settled')
  const reduced=await evaluate(`({height:document.querySelector('#construction').getBoundingClientRect().height,top:document.querySelector('#construction').getBoundingClientRect().top,viewport:innerHeight,scroll:getComputedStyle(document.documentElement).scrollBehavior})`)
  assert(reduced.height<=reduced.viewport+1,'Reduced motion removes the long scroll spacer')
  assert(Math.abs(reduced.top)<reduced.viewport*0.25,'Preference change preserves the current chapter')
  assert.equal(reduced.scroll,'auto')
  const reducedPose=await snapshot()
  await delay(650)
  if(initial.dev) assert.deepEqual((await snapshot()).camera,reducedPose.camera,'Static reduced-motion camera')
  await screenshot('reduced-motion')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await waitFor('document.querySelector(".experience-chapter").dataset.staticConstruction==="false"','motion re-enabled')
  await waitFor('Number(document.querySelector(".experience-scene-host").dataset.progress)>0.58 && Number(document.querySelector(".experience-scene-host").dataset.progress)<0.83','restored inspection coordinate')
  report.extra.push('Live reduced-motion change and chapter preservation')
  async function reattach(){
    return evaluate(`(async()=>{
      const url=performance.getEntriesByType('resource').find(item=>item.name.includes('/deps/@react-three_fiber.js'))?.name
      if(url){const api=await import(url);window.__qaScene=api._roots.get(document.querySelector('canvas')).store;window.__qaAfterEffect=api.addAfterEffect}
      window.__qaCanvas=document.querySelector('canvas')
    })()`)
  }
  await send('Page.navigate',{url:'about:blank'})
  await waitFor('location.href==="about:blank"','blank document before cold link')
  await evaluate('window.__qaOldDocument=true')
  await send('Page.navigate',{url:base+'#construction-inspect'})
  await waitFor('!window.__qaOldDocument && document.querySelector(".product-scene")?.dataset.sceneReady==="true"','deep-link document')
  await reattach()
  await waitFor('Number(document.querySelector(".experience-scene-host").dataset.progress)>0.58 && Number(document.querySelector(".experience-scene-host").dataset.progress)<0.83','deep-link inspection pose')
  assert.equal(await evaluate('document.querySelectorAll("canvas").length'),1)
  report.extra.push('Cold deep link')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await delay(300)
  await evaluate('window.__qaOldDocument=true')
  await send('Page.reload',{ignoreCache:true})
  await waitFor('!window.__qaOldDocument && document.querySelector(".product-scene")?.dataset.sceneReady==="true" && document.querySelector(".experience-chapter")?.dataset.staticConstruction==="true"','initial reduced-motion load')
  await reattach()
  await waitFor('Math.abs(Number(document.querySelector(".experience-scene-host").dataset.progress)-0.67)<0.001','initial static exploded pose')
  const staticStart=await snapshot()
  await delay(700)
  if(initial.dev) assert.deepEqual((await snapshot()).camera,staticStart.camera,'No startup flight with reduced motion')
  report.extra.push('Initial reduced-motion deep link')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  await waitFor('document.querySelector(".experience-chapter").dataset.staticConstruction==="false"','normal mode after reduced startup')
  await delay(350)
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
  await delay(350)
  await go(0)
  await evaluate('window.scrollTo({top:0,behavior:"instant"})')
  await evaluate('document.querySelector(".menu-toggle").click()')
  assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'true')
  await evaluate('document.querySelector("nav a[href=\\"#construction\\"]").click()')
  await waitFor('document.querySelector(".menu-toggle").getAttribute("aria-expanded")==="false"','mobile menu closes')
  await waitFor('document.querySelector("nav [aria-current]")?.getAttribute("href")==="#construction"','mobile inside navigation')
  await waitFor('Math.abs(document.querySelector("#construction").getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))<3','mobile native anchor settled')
  assert.equal(await evaluate('location.hash'),'#construction')
  report.extra.push('Mobile menu navigation')
  await go(0.67)
  assert.equal(errors.length,0,'No normal-operation runtime errors')
  assert.equal(warnings.length,0,'No normal-operation warnings')
  report.normalWarnings=[...warnings]
  const lost=await evaluate(`(()=>{const extension=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');if(!extension)return false;extension.loseContext();return true})()`)
  assert(lost,'Context-loss simulation available')
  await waitFor('document.querySelector(".fallback-exploded") && document.querySelector(".experience-chapter").dataset.staticConstruction==="true"','context-loss schematic')
  await waitFor('document.querySelectorAll("canvas").length===0','failed renderer removed')
  assert(await evaluate('document.querySelector("#construction").getBoundingClientRect().height<=innerHeight+1'))
  await evaluate('document.querySelectorAll(".layer-picker button")[6].click()')
  assert.equal(await evaluate('document.querySelector(".layer-readout h3").textContent'),'Lower enclosure')
  await screenshot('context-loss')
  await evaluate('document.querySelector(".construction-links a[href=\\"#overview\\"]").click()')
  await waitFor('document.querySelector("nav [aria-current]")?.getAttribute("href")==="#overview"','navigation after context loss')
  await waitFor('Math.abs(document.querySelector("#overview").getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))<3','continuation anchor settled')
  assert(await evaluate('document.querySelector(".experience-scene-host").getBoundingClientRect().bottom<100'),'Scene releases before the next section')
  report.extra.push('Context loss, static controls, and chapter release')
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl/.test(type)?null:original.call(this,type,...args)}`})
  await send('Page.navigate',{url:'about:blank'})
  await waitFor('location.href==="about:blank"','blank document before unavailable WebGL')
  await evaluate('window.__qaOldDocument=true')
  await send('Page.navigate',{url:base+'#construction-inspect'})
  await waitFor('!window.__qaOldDocument && document.querySelector(".fallback-exploded") && document.querySelector(".experience-chapter")?.dataset.staticConstruction==="true"','unavailable WebGL deep link')
  assert(await evaluate('document.querySelector("#construction").getBoundingClientRect().height<=innerHeight+1'))
  await evaluate('document.querySelectorAll(".layer-picker button")[4].click()')
  assert.equal(await evaluate('document.querySelector(".layer-readout h3").textContent'),'PCB & electronics')
  await screenshot('no-webgl')
  report.extra.push('Unavailable WebGL and functional fallback controls')
  assert.equal(errors.length,0,'No uncaught errors: '+JSON.stringify(errors))
  assert.equal(badResponses.length,0,'No failed requests: '+JSON.stringify(badResponses))
  report.errors=errors
  report.expectedFaultWarnings=warnings.slice(report.normalWarnings.length)
  report.badResponses=badResponses
  await writeFile('test-results/phase3-'+(initial.dev?'development':'production')+'-report.json',JSON.stringify(report,null,2))
  console.log(JSON.stringify({passed:true,stages:report.stages.length,widths:report.widths,hero:report.heroPerformance,exploded:report.explodedPerformance,idleFrames:report.idleFrames,extra:report.extra,errors:report.errors,warnings:report.normalWarnings},null,2))
} finally {
  await close()
}
