// Urlaub: Tagesart U, Urlaubsentgelt aus dem Durchschnitt der Vormonate (Ausfallprinzip), Urlaubskonto je Kalenderjahr
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ladeApp } from './helpers.mjs'

const mo = (h) => ({ mode: 'montage', stunden: h, fahrzeit: 0 })
const ur = (h) => ({ mode: 'urlaub', stunden: h, fahrzeit: 0 })
const k = (m, d) => `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
// Monat mit zehn Montage-Tagen à 11 h (Mo–Do): 1 h §68/2 je Tag, On-Site-Zulage, Montageprämie, Taggeld
function montageMonat(a, m, extra = '') {
  const dm = {}; let n = 0
  for (let d = 1; d <= 28 && n < 10; d++) { const w = new Date(2026, m - 1, d).getDay(); if (w >= 1 && w <= 4) { dm[k(m, d)] = mo(11); n++ } }
  a.dom.window.__t = dm
  a.run(`ladeMonat(${m},2026);state.grundgehalt=3600;state.taggeld=40;state.dayMap=window.__t;${extra}render();flushAutosave()`)
}
const urlaubNov = (a, tage = { [k(11, 2)]: ur(8.25), [k(11, 3)]: ur(8.25), [k(11, 6)]: ur(5.5) }, extra = '') => {
  a.dom.window.__t = tage
  a.run(`ladeMonat(11,2026);state.grundgehalt=3600;state.taggeld=40;state.dayMap=window.__t;${extra}render()`)
}
const lz = (a) => JSON.parse(a.run('JSON.stringify(state._res.lz)'))

test('Urlaub: Tag zählt mit Normalarbeitszeit, Wochenende und Feiertag nicht; Grundgehalt und ZA bleiben unverändert', () => {
  const a = ladeApp()
  urlaubNov(a, { [k(11, 2)]: ur(8.25), [k(11, 6)]: ur(5.5), [k(11, 7)]: ur(8.25), [k(12, 8)]: ur(8.25) })
  // Mo 8,25 h + Fr 5,5 h; Sa 7.11. zählt nicht
  const l = lz(a)
  assert.equal(l.urlaubStd, 13.75)
  assert.equal(l.urlaubTage, 2)
  assert.equal(l.grundgehalt, 3600)
  assert.equal(l.zaTopfNeu, 0, 'Urlaub bucht weder ZA zu noch ab')
  assert.match(a.run("state._hinweise.map(h=>h.text).join('|')"), /Sa 7\.11\.: Urlaub an einem Wochenend- oder Feiertag zählt nicht als Urlaubstag/)
  // Neuer Urlaubstag über das Tagesfenster bekommt die Normalarbeitszeit (Fr 5,5 h), Feiertag 0 h
  assert.equal(a.run(`defaultStunden('urlaub',keyToDate('2026-11-13'))`), 5.5)
  assert.equal(a.run(`defaultStunden('urlaub',keyToDate('2026-12-08'))`), 0)
  // halber Tag
  urlaubNov(a, { [k(11, 2)]: ur(4.125) })
  assert.equal(lz(a).urlaubTage, 0.5)
})

test('Urlaubsentgelt: Durchschnitt der variablen Bezüge der letzten 3 erfassten Monate je Sollstunde', () => {
  const a = ladeApp()
  for (const m of [7, 8, 9, 10]) montageMonat(a, m)
  // Erwartung von Hand: Überstunden, Zuschläge, On-Site- und Lenkzeit-Zulage je Monat; ohne Taggeld und Montageprämie
  const basis = (m) => a.run(`(()=>{const l=rechneMonat(recDaten(readMonate()['2026-${String(m).padStart(2, '0')}']),cfg()).lz;return l.ue50B+l.ue68_1B+l.ue68_2B+l.ueGrundB+l.zaUeberlaufZuschlagB+l.onSiteB+l.lkB})()`)
  const summe = Math.round((basis(8) + basis(9) + basis(10)) * 100) / 100
  const soll = 13 * 38.5 // August bis Oktober 2026 haben zusammen genau 65 Wochentage Mo–Fr
  urlaubNov(a)
  const du = JSON.parse(a.run('JSON.stringify(state.urlaubDurchschnitt)'))
  assert.deepEqual(du.monate, ['2026-08', '2026-09', '2026-10'], 'Juli liegt außerhalb von 3 Monaten')
  assert.equal(du.summe, summe)
  assert.equal(du.soll, soll)
  assert.equal(du.satz, Math.round(summe / soll * 100) / 100)
  const l = lz(a)
  assert.equal(l.urlaubSatz, du.satz)
  assert.equal(l.urlaubB, Math.round(22 * du.satz * 100) / 100)
  // Lohnart 1663 und laufender Bezug (SV- und steuerpflichtig)
  const z = JSON.parse(a.run('JSON.stringify(lohnartZeilen(state._res.lz).find(z=>z.la===\'1663\'))'))
  assert.equal(z.bez, 'Urlaubsentgelt (Durchschnitt)')
  assert.equal(z.ein, '22,00 h')
  assert.equal(z.betrag, l.urlaubB)
  assert.equal(l.lfdBrutto, Math.round((3600 + l.urlaubB) * 100) / 100)
  assert.equal(l.svBasisRoh, l.lfdBrutto)
  // Hinweis nennt Monate und Rechenweg
  assert.match(a.run("document.getElementById('urlaub-hint').textContent"), /Durchschnitt aus August 2026, September 2026, Oktober 2026/)
})

test('Urlaubsentgelt: Montageprämie nur auf Wunsch, Zeitraum einstellbar, Satz vom Lohnzettel hat Vorrang', () => {
  const a = ladeApp()
  for (const m of [8, 9, 10]) montageMonat(a, m)
  urlaubNov(a)
  const ohne = a.run('state.urlaubDurchschnitt.satz')
  a.run(`location.hash='einstellungen';zeigeView();document.getElementById('s-urlaubMitPraemie').checked=true;saveSettings()`)
  assert.ok(a.run('state.urlaubDurchschnitt.satz') > ohne, 'mit Montageprämie höher')
  a.run(`document.getElementById('s-urlaubMonate').value='1';saveSettings()`)
  assert.deepEqual(JSON.parse(a.run('JSON.stringify(state.urlaubDurchschnitt.monate)')), ['2026-10'])
  // Satz laut Lohnzettel
  a.run(`location.hash='erfassen';zeigeView();const i=document.getElementById('urlaubSatz');i.value='10.78';i.dispatchEvent(new Event('input'))`)
  assert.equal(lz(a).urlaubSatz, 10.78)
  assert.equal(lz(a).urlaubB, 237.16)
  assert.match(a.run("document.getElementById('urlaub-hint').textContent"), /selbst eingetragen/)
  a.run(`const i=document.getElementById('urlaubSatz');i.value='';i.dispatchEvent(new Event('input'))`)
  assert.equal(a.run('state.urlaubSatz'), null, 'leer = wieder automatisch')
})

test('Urlaubsentgelt: ohne Vormonate 0 € mit Hinweis; Feld nur bei Urlaub sichtbar', () => {
  const a = ladeApp()
  a.run(`location.hash='erfassen';zeigeView()`)
  urlaubNov(a, { [k(11, 12)]: mo(9) })
  assert.equal(a.run("document.getElementById('urlaubsatz-field').hidden"), true)
  urlaubNov(a)
  assert.equal(a.run("document.getElementById('urlaubsatz-field').hidden"), false)
  assert.equal(lz(a).urlaubB, 0)
  assert.match(a.run("document.getElementById('urlaub-hint').textContent"), /kein Vormonat erfasst/)
})

test('Urlaub: gespeicherter Monat behält seinen Satz, offene folgen den Vormonaten', () => {
  const a = ladeApp()
  for (const m of [8, 9, 10]) montageMonat(a, m)
  urlaubNov(a); a.run('flushAutosave();speichereMonat()')
  const erg = a.run(`readMonate()['2026-11'].saved.erg.brutto`)
  // Oktober nachträglich ändern: mehr Stunden → höherer Durchschnitt
  montageMonat(a, 10, 'Object.values(state.dayMap).forEach(t=>t.stunden=12);')
  assert.equal(a.run(`readMonate()['2026-11'].saved.erg.brutto`), erg)
  assert.equal(a.run(`recVeraltet(readMonate()['2026-11'])`), false, 'festgehaltene Fassung rechnet mit ihrem eigenen Satz')
  // Dezember (offen) mit Urlaub nimmt den neuen Durchschnitt
  a.dom.window.__t = { [k(12, 1)]: ur(8.25) }
  a.run('ladeMonat(12,2026);state.grundgehalt=3600;state.dayMap=window.__t;render();flushAutosave()')
  const satzDez = a.run('state._res.lz.urlaubSatz')
  assert.equal(a.run(`rechneMonat(recDaten(readMonate()['2026-12']),cfg()).lz.urlaubSatz`), satzDez)
  assert.deepEqual(JSON.parse(a.run('JSON.stringify(state.urlaubDurchschnitt.monate)')), ['2026-09', '2026-10', '2026-11'])
})

test('Urlaubskonto je Monat: Stand am Monatsanfang, Urlaubstage gehen ab, am 1. Jänner kommt der Anspruch dazu', async () => {
  const a = ladeApp()
  const warte = () => new Promise((r) => setTimeout(r, 0))
  // Beispiel: Anfang Dezember 29 Tage, im Dezember 4 Tage Urlaub
  a.dom.window.__t = { [k(12, 21)]: ur(8.25), [k(12, 22)]: ur(8.25), [k(12, 23)]: ur(8.25), [k(12, 28)]: ur(8.25) }
  a.run('ladeMonat(12,2026);state.grundgehalt=3600;state.dayMap=window.__t;render();flushAutosave()')
  assert.equal(a.run('urlaubStand(12,2026)'), null, 'ohne eingetragenen Stand unbekannt')
  a.run(`location.hash='erfassen';zeigeView();const i=document.getElementById('urlaubStart');i.value='29';i.dispatchEvent(new Event('input'))`)
  assert.deepEqual(JSON.parse(a.run('JSON.stringify(urlaubStand(12,2026))')), { start: 29, tage: 4, ende: 25, eingetragen: true, anspruchDazu: 0 })
  const t = a.run("document.getElementById('urlaub-pot').textContent").replace(/\s+/g, ' ')
  assert.match(t, /Urlaub ?25 ?Tage/)
  assert.match(t, /Anfang 29 · genommen −4 · Ende Dezember: 25/)
  // Jänner: Rest 25 + Jahresanspruch 25 = 50; Februar mit 2 Tagen Urlaub
  assert.deepEqual(JSON.parse(a.run('JSON.stringify(urlaubStand(1,2027))')), { start: 50, tage: 0, ende: 50, eingetragen: false, anspruchDazu: 25 })
  a.dom.window.__t = { '2027-02-15': ur(8.25), '2027-02-16': ur(8.25) }
  a.run('ladeMonat(2,2027);state.grundgehalt=3600;state.dayMap=window.__t;render();flushAutosave()'); await warte()
  assert.equal(a.run('urlaubStand(2,2027).ende'), 48, 'Monate ohne Datensatz dazwischen zählen mit 0 Tagen')
  assert.equal(a.run("document.getElementById('urlaubStart').placeholder"), '50', 'automatischer Wert als Platzhalter')
  // Eigener Stand in einem späteren Monat hat Vorrang (z.B. laut Lohnzettel)
  a.run(`const i=document.getElementById('urlaubStart');i.value='40';i.dispatchEvent(new Event('input'))`)
  assert.equal(a.run('urlaubStand(2,2027).ende'), 38)
  assert.equal(a.run('urlaubStand(3,2027).start'), 38)
  // Leeren = wieder automatisch
  a.run(`const i=document.getElementById('urlaubStart');i.value='';i.dispatchEvent(new Event('input'))`)
  assert.equal(a.run('urlaubStand(2,2027).start'), 50)
  // Stand gehört nicht zu den Lohndaten: gespeicherter Monat wird nicht „geändert“
  a.run('ladeMonat(12,2026);speichereMonat()')
  a.run(`const i=document.getElementById('urlaubStart');i.value='30';i.dispatchEvent(new Event('input'));flushAutosave()`)
  assert.equal(a.run(`recGeaendert(readMonate()['2026-12'])`), false)
  // Jahresübersicht
  a.run(`location.hash='monate';zeigeView();document.getElementById('jahr-sel').value='2026';renderJahr()`)
  assert.match(a.run("document.getElementById('jahr-kpis2').textContent").replace(/\s+/g, ' '), /Urlaub ?4 ?Tage ?Stand Ende Dezember: 26/)
})

test('Urlaubskonto: Übertrag aus Version 3.7.0 wird zum Stand am 1. Jänner (Übertrag + Anspruch)', () => {
  const a = ladeApp({ storage: { lzr_settings: { urlaubUebertrag: { 2026: 6 }, urlaubAnspruch: 25, _saved: 5 } } })
  assert.equal(a.run(`settings.urlaubStaende['2026-01']`), 31)
  assert.equal(a.run(`'urlaubUebertrag' in settings`), false)
  assert.equal(a.run('urlaubStand(11,2026).start'), 31)
})

test('Urlaub: Vorlage aus dem Vormonat übernimmt keine Urlaubstage; Kopieren passt die Stunden an', () => {
  const a = ladeApp()
  a.dom.window.__t = { [k(10, 5)]: mo(10), [k(10, 6)]: ur(8.25), [k(10, 12)]: mo(10), [k(10, 13)]: ur(8.25), [k(10, 19)]: mo(10), [k(10, 20)]: ur(8.25) }
  a.run('ladeMonat(10,2026);state.grundgehalt=3600;state.dayMap=window.__t;render();flushAutosave();ladeMonat(11,2026)')
  a.run(`vorlageAnwenden('2026-10')`)
  assert.equal(a.run(`Object.values(state.dayMap).some(t=>t.mode==='urlaub')`), false)
  a.run(`state.dayMap['${k(11, 2)}']={mode:'urlaub',stunden:8.25,fahrzeit:0};copyDay('${k(11, 2)}');pasteDay('${k(11, 6)}')`)
  assert.equal(a.run(`state.dayMap['${k(11, 6)}'].stunden`), 5.5, 'Freitag: 5,5 h')
})
