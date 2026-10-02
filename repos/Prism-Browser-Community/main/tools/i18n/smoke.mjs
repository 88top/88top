#!/usr/bin/env node
// Desktop DOM selectors and transitions were verified in the running Electron app.
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { launchApp, quitApp, evaluate, draft, removeTemporaryTree } from '../app-e2e/run.mjs'

const args = process.argv.slice(2)
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
const appPath = option('--app')
const output = resolve(option('--output') ?? join(tmpdir(), 'prism-community-i18n-results'))
const options = { app: appPath ?? resolve('node_modules/electron/dist', process.platform === 'darwin' ? 'Electron.app/Contents/MacOS/Electron' : process.platform === 'win32' ? 'electron.exe' : 'electron'), packaged: Boolean(appPath) }
const locales = ['zh-CN', 'zh-TW', 'en', 'ru', 'vi', 'th', 'pt-BR', 'fr', 'uk', 'es', 'tr', 'ja', 'hi']
const nativeNames = ['简体中文', '繁體中文', 'English', 'Русский', 'Tiếng Việt', 'ไทย', 'Português (Brasil)', 'Français', 'Українська', 'Español', 'Türkçe', '日本語', 'हिन्दी']
const catalogs = Object.fromEntries(await Promise.all(locales.map(async locale => [locale, JSON.parse(await readFile(resolve(`src/shared/locales/${locale}.json`), 'utf8'))])))
const data = await mkdtemp(join(tmpdir(), 'prism-i18n-smoke-'))
await mkdir(output, { recursive: true })
await writeFile(join(data, 'ui-language.json'), JSON.stringify({ locale: 'en' }))
let instance
const report = { app: options.app, locales: [], assertions: [], screenshots: [], passed: false }
const delay = ms => new Promise(r => setTimeout(r, ms))
const run = code => evaluate(instance.client, code)
const visibleDialog = `[...document.querySelectorAll('[role="dialog"]')].find(e => e.getClientRects().length > 0)`
async function waitFor(code, description, timeout = 10000) {
  const started = Date.now()
  while (Date.now() - started < timeout) { if (await run(`Boolean(${code})`)) return; await delay(60) }
  throw new Error(`Timed out: ${description}`)
}
async function screenshot(name) {
  await run('document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))')
  await run('Promise.all(document.getAnimations().filter(a => Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished.catch(() => undefined))).then(() => true)')
  await writeFile(join(output, `${name}.png`), Buffer.from((await instance.client.send('Page.captureScreenshot')).data, 'base64'))
  report.screenshots.push(`${name}.png`)
}
async function changeLanguage(locale) {
  if (await run('document.documentElement.lang') === locale) return
  await run(`document.querySelector('.language-selector .ant-select-content').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))`)
  const name = nativeNames[locales.indexOf(locale)]
  const selector = `.ant-select-item-option[title=${JSON.stringify(name)}]`
  await waitFor(`Boolean(document.querySelector(${JSON.stringify(selector)}))`, `language option ${locale}`)
  await run(`document.querySelector(${JSON.stringify(selector)}).click()`)
  await waitFor(`document.documentElement.lang === ${JSON.stringify(locale)} && !document.querySelector('.language-selector.ant-select-disabled')`, `language change ${locale}`)
  assert.equal(await run('window.browserApi.uiLanguage.get()'), locale)
  assert.equal(JSON.parse(await readFile(join(data, 'ui-language.json'), 'utf8')).locale, locale)
}
async function closeDialog() {
  await run(`(${visibleDialog})?.querySelector('.ant-modal-close')?.click()`)
  await waitFor(`!(${visibleDialog})`, 'close dialog')
}
async function clickButton(text) {
  const code = `[...document.querySelectorAll('button')].find(e => e.getClientRects().length && e.innerText.trim() === ${JSON.stringify(text)})`
  await waitFor(`Boolean(${code})`, `button ${text}`)
  await run(`(${code}).click()`)
}
const fingerprintForm = `Object.fromEntries(['fingerprint_language','fingerprint_acceptLanguages','fingerprint_timezone','fingerprint_seed'].map(id=>[id,document.getElementById(id)?.value]))`
try {
  const profileDraft = { ...draft('测试 Profile · 日本語', 918273, 'https://prismbrowser.app/'), note: '用户备注 — keep this verbatim', group: '用户分组', tags: ['自定义标签'] }
  profileDraft.fingerprint.language = 'ja-JP'
  profileDraft.fingerprint.acceptLanguages = 'ja-JP,ja,en'
  profileDraft.fingerprint.timezone = 'Asia/Tokyo'
  instance = await launchApp(options, data)
  await waitFor('window.browserApi && document.querySelector(".language-selector")', 'renderer startup')
  const original = await run(`window.browserApi.profiles.create(${JSON.stringify(profileDraft)})`)
  await quitApp(instance); instance = await launchApp(options, data)
  await waitFor(`document.documentElement.lang === 'en' && document.querySelector('.language-selector')`, 'initial English interface')
  for (const locale of locales) {
    await changeLanguage(locale)
    await waitFor(`document.body.innerText.includes(${JSON.stringify(original.name)}) && ![...document.querySelectorAll('.ant-spin-spinning')].some(e => e.getClientRects().length)`, `profile list rendered in ${locale}`)
    const title = await run("document.querySelector('.page-header h2')?.innerText")
    assert.ok(title.includes(catalogs[locale]['浏览器环境']), `${locale} heading`)
    const profile = (await run('window.browserApi.profiles.list()')).find(p => p.id === original.id)
    for (const key of ['name', 'note', 'group', 'tags', 'fingerprint', 'proxy', 'kernelVersion', 'startUrls']) assert.deepEqual(profile[key], original[key], `${locale}: unchanged ${key}`)
    const layout = await run('({width:innerWidth,contentWidth:document.documentElement.scrollWidth})')
    assert.ok(layout.contentWidth <= layout.width + 1, `${locale}: page overflow`)
    report.locales.push({ locale, heading: title, profileUnchanged: true, persisted: true })
    await screenshot(`main-${locale}`)
  }
  report.assertions.push('All 13 locales switch through the UI and persist; profile fields remain unchanged')
  await changeLanguage('en')
  await clickButton(catalogs.en['新建环境'])
  await waitFor("Boolean(document.getElementById('name'))", 'profile editor')
  await run(`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(document.getElementById('name'),'Unsaved 用户草稿');document.getElementById('name').dispatchEvent(new Event('input',{bubbles:true}))`)
  await run(`[...document.querySelectorAll('[role=tab]')].find(e=>e.innerText==='Fingerprint Settings').click()`)
  await screenshot('editor-fingerprint-en')
  const formBefore = await run(fingerprintForm)
  // Programmatic selector activation also checks that a locale render cannot reset an open draft.
  await changeLanguage('ru')
  assert.equal(await run("document.getElementById('name').value"), 'Unsaved 用户草稿')
  assert.deepEqual(await run(fingerprintForm), formBefore)
  await screenshot('editor-ru')
  await closeDialog()
  report.assertions.push('An open unsaved draft and its fingerprint values survive a locale change')
  await changeLanguage('ja')
  await quitApp(instance); instance = await launchApp(options, data)
  await waitFor("document.documentElement.lang === 'ja' && document.querySelector('.language-selector')", 'Japanese after restart')
  assert.deepEqual((await run('window.browserApi.profiles.list()')).find(p=>p.id===original.id).fingerprint, original.fingerprint)
  report.assertions.push('Japanese and the original fingerprint survive application restart')
  await screenshot('restart-ja')
  report.passed = true
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  report.error = String(error)
  if (instance) await screenshot('failure').catch(() => {})
  console.error(error)
  process.exitCode = 1
} finally {
  if (instance) await quitApp(instance)
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  await removeTemporaryTree(data)
}
