import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ladeApp } from './helpers.mjs'

const app = ladeApp()
const montage = (h, extra = {}) => ({ mode: 'montage', stunden: h, fahrzeit: 0, ...extra })

test('Normaler Monat: 3.000 € brutto → SV, Lohnsteuer und Netto 2026', () => {
  const { lz } = app.rechne({ grundgehalt: 3000 })
  assert.equal(lz.svB, 542.1)         // 18,07 %
  assert.equal(lz.ls, 283.82)         // Tarif 2026 inkl. Verkehrsabsetzbetrag
  assert.equal(lz.netto, 2174.08)
})

test('Stundensatz = Grundgehalt ÷ 143', () => {
  const { lz } = app.rechne({ grundgehalt: 3575 })
  assert.equal(lz.stundensatz, 25)
})

test('SV ist bei der Höchstbeitragsgrundlage (6.930 €) gedeckelt', () => {
  const { lz } = app.rechne({ grundgehalt: 9000 })
  assert.equal(lz.svBasis, 6930)
  assert.equal(lz.svB, 1252.25)
})

test('Lehrling: reduzierter SV-Satz, AV entfällt bei geringem Einkommen', () => {
  const { lz } = app.rechne({ grundgehalt: 1000, lehrling: true })
  assert.equal(lz.svB, 119.2)          // 1,67 % + 10,25 %
  assert.equal(lz.ls, 0)
})

test('Mo–Do: 8,25 h im Grundgehalt, bis 10 h in den ZA-Topf, darüber §68/2', () => {
  const { tage } = app.rechne({ tage: { '2026-10-06': montage(11) } })
  const di = tage.find((t) => t.key === '2026-10-06')
  assert.equal(di.nazStunden, 8.25)
  assert.equal(di.zaTopfStunden, 1.75)
  assert.equal(di.ueStd100_68_2, 1)
})

test('Sonntagsarbeit: §68/1-Zuschlag und 1:1 Ruhezeit', () => {
  const { lz, ruhe } = app.rechne({ tage: { '2026-10-11': montage(8) } })
  assert.equal(lz.ue68_1Std, 8)
  assert.equal(ruhe.ruheNeu, 8)
})

test('ZA-Tag nimmt zuerst aus dem Ruhezeit-Topf, dann aus dem ZA-Topf', () => {
  const { ruhe, lz } = app.rechne({ tage: {
    '2026-10-11': montage(5),                                    // Sonntag → 5 h Ruhezeit
    '2026-10-12': { mode: 'za', stunden: 8.25, fahrzeit: 0 },    // Montag ZA
  } })
  assert.equal(ruhe.ruheVerbrauch, 5)
  assert.equal(lz.zaTopfNeu, -3.25)
})

test('10/4-Modell: Sa/So ohne Zuschläge und ohne Ruhezeit', () => {
  const { lz, ruhe } = app.rechne({ tage: {
    '2026-10-10': montage(10, { tausch: true }),
    '2026-10-11': montage(10, { tausch: true }),
  } })
  assert.equal(lz.ue50Std, 0)
  assert.equal(lz.ue68_1Std, 0)
  assert.equal(ruhe.ruheNeu, 0)
  assert.equal(lz.zaTopfNeu, 3.5)     // je 1,75 h wie an einem Dienstag
})

test('Reisetag zieht keine ZA ab', () => {
  const { lz } = app.rechne({ tage: { '2026-10-07': { mode: 'montage_reise', stunden: 0, fahrzeit: 6 } } })
  assert.equal(lz.zaTopfNeu, 0)
})

test('Taggeld ist nur bis zum Satz des Einsatzlandes steuerfrei', () => {
  const { lz } = app.rechne({ taggeld: 50, tage: {
    '2026-10-06': montage(10, { land: 'DE' }),
    '2026-10-07': montage(10, { land: 'AT' }),
  } })
  assert.equal(lz.tgFrei, 65.3)       // 35,30 € (DE) + 30,00 € (AT)
  assert.equal(lz.tgStpfl, 34.7)
})

test('Überstundenzuschläge §68/2: höchstens 170 € steuerfrei', () => {
  const tage = {}
  for (const d of [3, 10, 17, 24, 31]) tage[`2026-10-${String(d).padStart(2, '0')}`] = montage(10)  // Samstage
  const { lz } = app.rechne({ grundgehalt: 3575, tage })
  assert.equal(lz.topf68_2Std, 50)
  assert.equal(lz.frei68_2, 170)
})

test('Feiertage: Pfingstmontag 2026 und Feiertag im Einsatzland', () => {
  assert.equal(app.run(`getFeiertagName(new Date(2026, 4, 25))`), 'Pfingstmontag')
  assert.equal(app.run(`getFeiertagName(new Date(2026, 4, 24))`), null)
  // Buß- und Bettag nur in Sachsen
  const { lz } = app.rechne({ monat: 11, tage: { '2026-11-18': montage(10, { land: 'DE', region: 'SN' }) } })
  assert.equal(lz.ue68_2Std, 10)
})

test('Feiertage: bei Montage im Ausland zählen nur die Feiertage des Einsatzlandes', () => {
  // 26.10.2026: Nationalfeiertag in Österreich, in Deutschland normaler Arbeitstag
  assert.equal(app.rechne({ tage: { '2026-10-26': montage(10, { land: 'DE', region: 'BY' }) } }).lz.ue68_2Std, 0)
  assert.equal(app.rechne({ tage: { '2026-10-26': montage(10, { land: 'AT' }) } }).lz.ue68_2Std, 10)
})

test('Urlaubsgeld: eigener SV-Satz und 6 % nach 620 € Freibetrag', () => {
  const { lz } = app.rechne({ grundgehalt: 3500, urlaubsgeld: 3500 })
  assert.equal(lz.szSV, 597.45)       // 17,07 %
  assert.equal(lz.szLS6, 136.95)
})

test('Montageprämie: 500 € je 30 Tage aliquot je Montage-Tag, laufender Bezug (Lohnart 1050)', () => {
  const tage = { '2026-10-06': montage(10), '2026-10-07': montage(10), '2026-10-08': montage(10),
    '2026-10-09': { mode: 'montage_reise', stunden: 8, fahrzeit: 2 } }
  const mit = app.rechne({ tage }).lz, ohne = app.rechne({ tage, saetze: { montagePraemie: 0 } }).lz
  assert.equal(mit.mpB, 66.67)                       // 500 / 30 × 4
  assert.equal(ohne.mpB, 0)
  assert.equal(Math.round((mit.lfdBrutto - ohne.lfdBrutto) * 100) / 100, 66.67)
  assert.ok(mit.svB > ohne.svB && mit.ls > ohne.ls, 'steuer- und SV-pflichtig')
  const zeile = JSON.parse(app.run(`JSON.stringify(lohnartZeilen(rechneMonat({monat:10,jahr:2026,grundgehalt:3000,dayMap:${JSON.stringify(tage)}},{}).lz).find(z=>z.la==='1050'))`))
  assert.equal(zeile.betrag, 66.67)
  assert.equal(app.rechne({ tage: { '2026-10-06': { mode: 'buero', stunden: 8.25, fahrzeit: 0 } } }).lz.mpB, 0)
})
