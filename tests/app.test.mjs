import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ladeApp } from './helpers.mjs'

const montage = (h, extra = {}) => ({ mode: 'montage', stunden: h, fahrzeit: 0, ...extra })

// ── Rechenkern ────────────────────────────────────────────────────────────────
// Die Montageprämie (ab 3.1.1) ist bewusst neu – ohne sie muss alles andere gleich bleiben
test('Referenzwerte: Berechnung 2026 unverändert gegenüber v1.1', () => {
  const app = ladeApp()
  const ref = JSON.parse(readFileSync(new URL('./fixtures/referenz-v1.json', import.meta.url), 'utf8'))
  for (const [name, { input, lz, ruhe }] of Object.entries(ref)) {
    const res = app.rechne({ ...input, saetze: { montagePraemie: 0 } })
    for (const k of Object.keys(lz)) assert.deepEqual(res.lz[k], lz[k], `${name}: lz.${k}`)
    assert.deepEqual(res.ruhe, ruhe, `${name}: ruhe`)
  }
})

test('Steuerjahr: 2025 rechnet mit eigenen Werten, unbekannte Jahre mit Ersatz und Warnung', () => {
  const app = ladeApp()
  const a = app.rechne({ grundgehalt: 3000, jahr: 2025 }), b = app.rechne({ grundgehalt: 3000, jahr: 2026 })
  assert.equal(a.werte.jahr, 2025)
  assert.ok(a.lz.ls > b.lz.ls, 'Tarifstufen 2025 sind niedriger → mehr Lohnsteuer')
  const c = app.rechne({ grundgehalt: 3000, jahr: 2030 })
  assert.equal(c.werte.jahr, 2026)
  assert.equal(c.werte.exakt, false)
  const warn = app.run(`pruefeMonat({jahr:2030,grundgehalt:3000},rechneMonat({monat:1,jahr:2030,grundgehalt:3000,dayMap:{}})).map(h=>h.text).join('|')`)
  assert.match(warn, /Für 2030 sind keine Steuer- und SV-Werte hinterlegt/)
})

test('Schaltjahr: Februar 2028 hat 29 Tage, 2027 hat 28', () => {
  const app = ladeApp()
  assert.equal(app.run(`getWeeksOfMonth(2,2028).flat().filter(Boolean).length`), 29)
  assert.equal(app.run(`getWeeksOfMonth(2,2027).flat().filter(Boolean).length`), 28)
})

test('Plausibilität: mehr als 12 h am Tag und fehlendes Taggeld werden gemeldet', () => {
  const app = ladeApp()
  const t = app.run(`(()=>{const d={monat:10,jahr:2026,grundgehalt:3000,taggeld:0,dayMap:{'2026-10-06':{mode:'montage',stunden:13,fahrzeit:0}}};return pruefeMonat(d,rechneMonat(d)).filter(h=>h.typ==='warnung').map(h=>h.text).join('|')})()`)
  assert.match(t, /über der Tageshöchstarbeitszeit/)
  assert.match(t, /kein Taggeld-Satz/)
})

test('Soll-Ist: Übereinstimmung, ungeklärte und geklärte Abweichung, unvollständig', () => {
  const app = ladeApp()
  const lz = app.rechne({ grundgehalt: 3000, tage: { '2026-10-10': montage(8) } }).lz
  app.dom.window.__lz = lz
  const si = (ist) => { app.dom.window.__ist = ist; return app.run(`sollIst(window.__lz, window.__ist, 1)`) }
  const kat = (s, k) => s.kats.find((c) => c.kat === k)
  let s = si({ werte: {} })
  assert.equal(kat(s, 'grund').status, 'leer')
  s = si({ werte: { 1000: 3000, netto: lz.netto - 50 } })
  assert.equal(kat(s, 'grund').status, 'ok')
  assert.equal(kat(s, 'netto').status, 'offen')
  assert.equal(kat(s, 'netto').diff, -50)
  s = si({ werte: { netto: lz.netto - 50 }, geklaert: { netto: true } })
  assert.equal(kat(s, 'netto').status, 'geklaert')
  s = si({ werte: { 1500: lz.ue50B } })   // Sa-Zuschlag eingetragen, Grundvergütung (1590) fehlt
  assert.equal(kat(s, 'zuschlag').status, 'unvollstaendig')
  s = si({ werte: { netto: lz.netto + 0.6 } })
  assert.equal(kat(s, 'netto').status, 'ok', 'innerhalb der Toleranz')
})

test('Arbeitsmodell: Rhythmus 10/4 läuft über die Monatsgrenze korrekt weiter', () => {
  const app = ladeApp()
  const nov = app.run(`rhythmusMonat(MODELLE[1],new Date(2026,9,1),11,2026,{...DEFAULT_SETTINGS.turnus,reise:false},'DE','BY')`)
  // Durchgänge starten am 1.10., 15.10., 29.10., 12.11. → 29.10.–7.11. Arbeit, 8.–11.11. frei
  assert.equal(nov['2026-11-07'].mode, 'montage')
  assert.equal(nov['2026-11-08'].mode, 'frei')
  assert.equal(nov['2026-11-11'].mode, 'frei')
  assert.equal(nov['2026-11-12'].mode, 'montage')
  assert.equal(nov['2026-11-12'].land, 'DE')
  assert.equal(nov['2026-11-14'].tausch, true)
  assert.deepEqual(JSON.parse(app.run(`JSON.stringify(parseMuster('6/1/4/3'))`)), [[6, 1], [4, 3]])
  assert.equal(app.run(`parseMuster('12')`), null)
})

// ── Speicherung, Status, Monatsübertrag ───────────────────────────────────────
function setzeMonat(app, monat, jahr, tage, extra = '') {
  app.dom.window.__tage = tage
  app.run(`ladeMonat(${monat},${jahr});state.grundgehalt=3000;state.dayMap=window.__tage;${extra}render();flushAutosave()`)
}

test('Automatisches Speichern und Wiederherstellung nach Neustart', () => {
  const a = ladeApp()
  setzeMonat(a, 10, 2026, { '2026-10-06': montage(11) })
  const st = a.storage()
  assert.equal(st.lzr_aktiv, '2026-10')
  assert.equal(st.lzr_monate['2026-10'].status, 'offen')
  const b = ladeApp({ storage: st })
  assert.equal(b.run('curKey()'), '2026-10')
  assert.equal(b.run(`state.dayMap['2026-10-06'].stunden`), 11)
})

test('Leere, nur angesehene Monate werden nicht gespeichert', () => {
  const a = ladeApp()
  a.run('ladeMonat(3,2026);render();flushAutosave();ladeMonat(4,2026);flushAutosave()')
  assert.deepEqual(a.storage().lzr_monate ?? {}, {})
})

test('Zeitkonten werden in den Folgemonat übertragen', () => {
  const a = ladeApp()
  setzeMonat(a, 10, 2026, { '2026-10-06': montage(10), '2026-10-11': montage(4) })   // +1,75 h ZA, 4 h Ruhezeit
  a.run('monatWechseln(1)')
  assert.equal(a.run('curKey()'), '2026-11')
  assert.equal(a.run('state.zaTopfStart'), 1.75)
  assert.equal(a.run('state.ruheStart'), 4)
})

test('Gespeicherte Abrechnung bleibt unverändert, Änderungen und Neuberechnung werden gekennzeichnet', () => {
  const a = ladeApp()
  setzeMonat(a, 10, 2026, { '2026-10-10': montage(8) })
  a.run('speichereMonat()')
  const netto = a.storage().lzr_monate['2026-10'].saved.erg.netto
  assert.equal(a.run(`readMonate()['2026-10'].status`), 'gespeichert')
  // Eingaben ändern → „geändert“, gespeicherte Fassung bleibt
  a.run(`state.dayMap['2026-10-17']={mode:'montage',stunden:8,fahrzeit:0};render();flushAutosave()`)
  assert.equal(a.run(`recGeaendert(readMonate()['2026-10'])`), true)
  assert.equal(a.storage().lzr_monate['2026-10'].saved.erg.netto, netto)
  a.run(`state.dayMap={'2026-10-10':{mode:'montage',stunden:8,fahrzeit:0}};render();flushAutosave()`)
  // Einstellung ändern → „veraltet“, aber kein stilles Überschreiben
  a.run('settings.teiler=150')
  assert.equal(a.run(`recVeraltet(readMonate()['2026-10'])`), true)
  assert.equal(a.storage().lzr_monate['2026-10'].saved.erg.netto, netto)
  // Bewusste Neuberechnung: neue Werte, alte Fassung im Verlauf
  a.run(`neuBerechnen('2026-10')`)
  const rec = a.storage().lzr_monate['2026-10']
  assert.notEqual(rec.saved.erg.netto, netto)
  assert.equal(rec.saved.aktualisiert, true)
  assert.equal(rec.history.length, 1)
  assert.equal(rec.history[0].erg.netto, netto)
  assert.equal(a.run(`recVeraltet(readMonate()['2026-10'])`), false)
})

test('Abgerechnet: Status setzen und nur nach Rückfrage überschreiben', () => {
  const a = ladeApp()
  setzeMonat(a, 10, 2026, { '2026-10-10': montage(8) })
  a.run('toggleAbgerechnet()')
  assert.equal(a.storage().lzr_monate['2026-10'].status, 'abgerechnet')
  a.run(`window.confirm=()=>false;state.dayMap['2026-10-17']={mode:'montage',stunden:8,fahrzeit:0};render();speichereMonat()`)
  assert.equal(Object.keys(a.storage().lzr_monate['2026-10'].saved.data.dayMap).length, 1, 'Abbruch lässt die Fassung unverändert')
})

test('Arbeitsmodell überschreibt vorhandene Einträge nur nach Bestätigung', () => {
  const a = ladeApp()
  setzeMonat(a, 10, 2026, { '2026-10-05': { mode: 'buero', stunden: 8.25, fahrzeit: 0 } })
  a.run(`window.confirm=()=>false;startPlace(MODELLE[0]);placeModel(new Date(2026,9,5))`)
  assert.equal(a.run(`state.dayMap['2026-10-05'].mode`), 'buero')
  assert.ok(a.run('state.place'), 'nach Abbruch bleibt der Modus aktiv')
  a.run(`window.confirm=()=>true;placeModel(new Date(2026,9,5))`)
  assert.equal(a.run(`state.dayMap['2026-10-05'].mode`), 'montage')
})

test('Jahresübersicht: fehlende Monate zählen nicht als 0 €, offene Monate sind Schätzungen', () => {
  const a = ladeApp()
  setzeMonat(a, 1, 2026, { '2026-01-10': montage(8) })
  a.run('speichereMonat()')
  setzeMonat(a, 3, 2026, { '2026-03-07': montage(8) })
  const d = JSON.parse(a.run(`JSON.stringify(jahresDaten(2026))`))
  assert.equal(d.filter((m) => !m.fehlt).length, 2)
  assert.equal(d[1].fehlt, true)
  assert.equal(d[0].geschaetzt, false)
  assert.equal(d[2].geschaetzt, true)
  const csv = a.run('jahrCSV(2026)')
  assert.match(csv, /Februar;nicht erfasst/)
  assert.ok(csv.startsWith('﻿'))
})

test('Monats-CSV enthält Lohnarten, Soll und Ist', () => {
  const a = ladeApp()
  setzeMonat(a, 10, 2026, {})
  a.run(`updateIst(x=>{x.werte['1000']=2990})`)
  const csv = a.run(`monatCSV('2026-10')`)
  assert.match(csv, /1000;Grundgehalt;;;3000,00;2990,00;-10,00/)
  assert.match(csv, /Netto \(geschätzt\)/)
})

test('Datensätze der Vorversion werden einmalig übernommen', () => {
  const alt = [{ name: 'Oktober 2026', saved: 1, data: { v: 1, monat: 10, jahr: 2026, grundgehalt: 3000, taggeld: 0, zaTopfMax: 0, zaTopfStart: 0, ruheStart: 0, lehrling: false, urlaubsgeldAktiv: false, urlaubsgeldBetrag: 0, extras: [], dayMap: { '2026-10-06': montage(10) } } }]
  const a = ladeApp({ storage: { lzr_datasets: alt } })
  const rec = a.storage().lzr_monate['2026-10']
  assert.equal(rec.status, 'gespeichert')
  assert.equal(rec.saved.erg.netto, a.rechne({ grundgehalt: 3000, tage: alt[0].data.dayMap }).lz.netto)
  assert.equal(a.storage().lzr_migriert_v2, true)
  assert.ok(a.storage().lzr_datasets, 'alte Daten bleiben erhalten')
})

test('Einführung nur beim ersten Besuch', () => {
  const a = ladeApp()
  assert.equal(a.run(`document.getElementById('intro').hidden`), false)
  a.run('introSchliessen()')
  assert.equal(ladeApp({ storage: a.storage() }).run(`document.getElementById('intro').hidden`), true)
  assert.equal(ladeApp({ storage: { lzr_settings: { _saved: 1 }, lzr_monate: { '2026-10': { status: 'offen', draft: { data: { monat: 10, jahr: 2026, dayMap: {} } } } } } }).run(`document.getElementById('intro').hidden`), true)
})

test('Alle Daten löschen entfernt Monate und Einstellungen', () => {
  const a = ladeApp()
  setzeMonat(a, 10, 2026, { '2026-10-06': montage(10) })
  a.run('settings.grundgehalt=4000;persistSettings();allesLoeschen()')
  const st = a.storage()
  assert.equal(st.lzr_monate, undefined)
  assert.equal(st.lzr_settings, undefined)
  assert.equal(a.run('Object.keys(state.dayMap).length'), 0)
})

test('Alle Seiten lassen sich ohne Fehler anzeigen', () => {
  const a = ladeApp()
  setzeMonat(a, 10, 2026, { '2026-10-06': montage(11, { land: 'DE', region: 'BY' }), '2026-10-11': montage(6) })
  for (const v of ['erfassen', 'ergebnis', 'monate', 'einstellungen', 'hilfe']) {
    a.run(`location.hash='${v}';zeigeView()`)
    assert.ok(a.run(`document.getElementById('view-${v}').classList.contains('active')`), v)
  }
  a.run(`location.hash='erfassen';zeigeView()`)
  assert.equal(a.run(`document.querySelectorAll('#cal-grid .day-btn').length`), 31)
  assert.equal(a.run(`document.getElementById('res-netto').textContent`), a.run(`fmt(state._res.lz.netto)+'€'`))
  assert.equal(a.run(`document.getElementById('monat-kopf').hidden`), false)
  a.run(`location.hash='monate';zeigeView()`)
  assert.equal(a.run(`document.getElementById('monat-kopf').hidden`), true, 'Monatskopf nur bei Erfassen und Ergebnis')
  a.run(`location.hash='jahr';zeigeView()`)
  assert.equal(a.run('aktiveView()'), 'monate', 'alte Adressen bleiben gültig')
  a.run(`location.hash='erfassen';zeigeView()`)
  a.run(`openDD('2026-10-06',document.querySelector('[data-key="2026-10-06"]'))`)
  assert.match(a.run(`document.getElementById('dd-content').textContent`), /ZA-Konto\+1,75 h/)
})
