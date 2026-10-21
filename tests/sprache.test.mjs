import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ladeApp } from './helpers.mjs'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const woerterbuch = JSON.parse(html.match(/<script id="i18n-en" type="application\/json">([\s\S]*?)<\/script>/)[1])
const tick = () => new Promise((r) => setTimeout(r, 0))
const navText = (app) => [...app.dom.window.document.querySelectorAll('.pr-nav a')].map((a) => a.textContent.trim())

test('Sprache: Deutsch ist Standard', async () => {
  const app = ladeApp()
  await tick()
  assert.equal(app.dom.window.document.documentElement.lang, 'de')
  assert.ok(navText(app).includes('Erfassen'))
  assert.equal(app.run('fmt(1234.5)'), (1234.5).toLocaleString('de-AT', { minimumFractionDigits: 2 }))
})

test('Sprache: Englisch übersetzt Oberfläche und Zahlenformat', async () => {
  const app = ladeApp({ storage: { lzr_settings: { lang: 'en' } } })
  await tick()
  const doc = app.dom.window.document
  assert.equal(doc.documentElement.lang, 'en')
  assert.deepEqual(navText(app).slice(0, 4), ['Record', 'Result', 'Saved months', 'Settings'])
  assert.equal(app.run('fmt(1234.5)'), '1,234.50')
  // Platzhalter: Zahlen und Monate werden eingesetzt
  assert.equal(app.run('pcT("Oktober 2026")'), 'October 2026')
  // Später eingefügte Texte werden ebenfalls übersetzt
  app.run('toast("Einstellungen gespeichert")')
  await tick()
  assert.ok(doc.body.textContent.includes('Settings saved'))
})

test('Sprache: Datei-Kopie für „Einstellungen speichern“ behält die deutschen Texte', async () => {
  const app = ladeApp({ storage: { lzr_settings: { lang: 'en' } } })
  await tick()
  const quelle = app.run('pcQuelle().outerHTML')
  assert.match(quelle, />Erfassen</)
  assert.doesNotMatch(quelle, />Record</)
})

test('Wörterbuch: jeder Eintrag hat dieselben Platzhalter wie das Original', () => {
  const zaehle = (s) => (s.match(/\{\d*\}/g) || []).length
  for (const [de, en] of Object.entries(woerterbuch)) {
    assert.equal(typeof en, 'string', de)
    assert.ok(en.trim().length > 0, 'leer: ' + de)
    assert.equal(zaehle(en), zaehle(de), 'Platzhalter: ' + de)
    const idx = (en.match(/\{(\d+)\}/g) || []).map((x) => +x.slice(1, -1)).sort()
    if (idx.length) assert.deepEqual(idx, [...Array(zaehle(de)).keys()], 'Reihenfolge: ' + de)
  }
})
