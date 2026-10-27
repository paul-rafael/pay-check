import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

// Lädt die App in einer simulierten Browser-Umgebung und gibt Zugriff auf ihren Zustand.
// storage: Startinhalt von localStorage (Werte werden als JSON abgelegt)
export function ladeApp({ storage = {}, hash = '' } = {}) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://example.test/' + (hash ? '#' + hash : ''),
    beforeParse(win) {
      win.localStorage.clear()
      for (const [k, v] of Object.entries(storage)) win.localStorage.setItem(k, JSON.stringify(v))
      win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
      win.confirm = () => true
      win.print = () => {}
      win.scrollTo = () => {}
      win.URL.createObjectURL = () => 'blob:test'
      win.URL.revokeObjectURL = () => {}
    },
  })
  const run = (code) => dom.window.eval(code)
  return {
    dom,
    run,
    // Inhalt von localStorage als Objekt
    storage() {
      const s = dom.window.localStorage, o = {}
      for (let i = 0; i < s.length; i++) { const k = s.key(i); o[k] = JSON.parse(s.getItem(k)) }
      return o
    },
    // Rechnet einen Monat mit dem Rechenkern und liefert das Lohnzettel-Ergebnis
    rechne({ monat = 10, jahr = 2026, grundgehalt = 3000, taggeld = 0, tage = {}, lehrling = false, urlaubsgeld = 0, extras = [], teiler = 143, saetze } = {}) {
      dom.window.__in = { monat, jahr, grundgehalt, taggeld, tage, lehrling, urlaubsgeld, extras, teiler, saetze }
      return JSON.parse(run(`JSON.stringify((() => {
        const i = window.__in
        const res = rechneMonat({ monat: i.monat, jahr: i.jahr, grundgehalt: i.grundgehalt, taggeld: i.taggeld, lehrling: i.lehrling,
          zaTopfMax: 0, zaTopfStart: 0, ruheStart: 0, dayMap: i.tage, urlaubsgeldAktiv: i.urlaubsgeld > 0,
          urlaubsgeldBetrag: i.urlaubsgeld, extras: i.extras }, { teiler: i.teiler, saetze: i.saetze })
        res.tage.forEach((t) => { t.key = dateKey(t.datum) })
        return { lz: res.lz, ruhe: res.ruhe, tage: res.tage, werte: res.werte }
      })())`))
    },
  }
}
