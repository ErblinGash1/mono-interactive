import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { launchBrowser } from './chrome.mjs'

const { send, evaluate, close, errors, warnings, badResponses } = await launchBrowser()
const base = process.env.QA_URL || 'http://127.0.0.1:5173/'
const mode = process.env.QA_MODE || 'development'
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms))
const report = { mode, errors, warnings, badResponses }
async function waitFor(expression) {
  for (let i=0;i<150;i++) { if (await evaluate(expression)) return; await delay(100) }
  throw new Error('Timed out: '+expression)
}
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
  await send('Page.bringToFront'); await send('Emulation.setFocusEmulationEnabled',{enabled:true})
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})
  await send('Page.navigate',{url:base})
  await waitFor(`document.querySelector('.product-scene')?.dataset.sceneReady==='true'`)
  await delay(3500)
  report.dom = await evaluate(`(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id)
    return {
      h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,
      duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),
      brokenFragments:[...document.querySelectorAll('a[href^="#"]')].map(e=>e.getAttribute('href')).filter(h=>h==='#'||!document.getElementById(h.slice(1))),
      unnamedButtons:[...document.querySelectorAll('button')].filter(e=>!(e.getAttribute('aria-label')||e.textContent).trim()).length,
      imagesWithoutAlt:document.querySelectorAll('img:not([alt])').length,
      overflow:document.documentElement.scrollWidth>innerWidth,
      targets:[...document.querySelectorAll('.hero-actions a,.menu-toggle')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))
    }
  })()`)
  assert.equal(report.dom.h1,1); assert.equal(report.dom.main,1)
  assert.deepEqual(report.dom.duplicateIds,[]); assert.deepEqual(report.dom.brokenFragments,[])
  assert.equal(report.dom.unnamedButtons+report.dom.imagesWithoutAlt,0)
  assert(!report.dom.overflow)
  assert(report.dom.targets.every(r=>r.width>=44&&r.height>=44))
  await evaluate(`document.querySelector('.skip-link').focus()`)
  report.focus = await evaluate(`({focused:document.activeElement===document.querySelector('.skip-link'),outline:getComputedStyle(document.activeElement).outlineWidth})`)
  assert(report.focus.focused); assert(parseFloat(report.focus.outline)>=2)
  // Native touch scrolling through the model must remain available on mobile.
  await evaluate(`(()=>{const slot=document.querySelector('.scene-slot').getBoundingClientRect();const boundary=document.querySelector('#construction').getBoundingClientRect().top+scrollY-innerHeight;scrollTo({top:Math.max(0,Math.min(slot.top+scrollY-150,boundary-20)),behavior:'instant'})})()`)
  await waitFor(`Number(document.querySelector('.experience-scene-host').dataset.progress)===0`)
  await delay(500)
  const point=await evaluate(`(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const x=r.x+r.width/2;const y=r.y+r.height/2;return {x,y,touchAction:getComputedStyle(c).touchAction,tag:document.elementFromPoint(x,y)?.tagName}})()`)
  report.touchTarget=point
  report.touchAncestors=await evaluate(`(()=>{const items=[];let e=document.querySelector('canvas');while(e){const s=getComputedStyle(e);items.push({tag:e.tagName,className:e.className,touchAction:s.touchAction,overflowY:s.overflowY});e=e.parentElement}return items})()`)
  assert.equal(point.tag,'CANVAS','Touch gesture targets the interactive hero canvas')
  const before = await evaluate('scrollY')
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]})
  for(const distance of [30,60,90,120,150]){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-distance}]});await delay(60)}
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await delay(500)
  report.touchScroll = (await evaluate('scrollY'))-before
  assert(report.touchScroll>30,'Native touch scrolling remains usable')
  if(mode==='development') {
    await evaluate(`(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/deps/@react-three_fiber.js')).name;const api=await import(url);window.__auditScene=api._roots.get(document.querySelector('canvas')).store;document.querySelector('#design-notes').scrollIntoView({behavior:'instant'})})()`)
    await delay(1000)
    const initialFrame=await evaluate('window.__auditScene.getState().gl.info.render.frame')
    await evaluate(`scrollTo({top:scrollY+20,behavior:'instant'})`)
    await delay(350)
    await evaluate(`scrollTo({top:scrollY-20,behavior:'instant'})`)
    await delay(350)
    report.offscreenScrollFrames=(await evaluate('window.__auditScene.getState().gl.info.render.frame'))-initialFrame
    assert.equal(report.offscreenScrollFrames,0,'Offscreen editorial scrolling requests no GPU frames')
  }
  // Cross the editorial gap in both directions without a second canvas.
  report.chapters=[]
  for (const id of ['construction-inspect','overview','design-notes','signature-key','finale-composition','signature-key','design-notes','overview','construction-inspect','experience']) {
    await evaluate(`document.getElementById(${JSON.stringify(id)}).scrollIntoView({behavior:'instant'})`)
    await delay(500)
    const state=await evaluate(`({region:document.querySelector('.experience-scene-host').dataset.region,canvasCount:document.querySelectorAll('canvas').length,overflow:document.documentElement.scrollWidth>innerWidth})`)
    assert.equal(state.canvasCount,1); assert(!state.overflow)
    if (id==='design-notes') assert.equal(state.region,'story')
    report.chapters.push({id,...state})
  }
  assert.equal(errors.length,0); assert.equal(warnings.length,0); assert.equal(badResponses.length,0)
  report.passed=true
} catch(error) { report.failure=error.stack;process.exitCode=1;console.error(error.stack) }
finally { await writeFile(`test-results/phase5-${mode}-report.json`,JSON.stringify(report,null,2));await close() }
