import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBetrag, gruppiereZeilen, zahlenInZeile, waehleBetrag, erkenneZeitraeume, werteAus, vergleiche } from '../lohnzettel/parser.mjs'
import { KONFIGURATION } from '../lohnzettel/konfiguration.mjs'

// Hilfsfunktion: Textzeilen in OCR-Wörter mit Position umwandeln (synthetisch, kein echter Lohnzettel)
function woerter(zeilen, conf = 95) {
  const out = []
  zeilen.forEach((z, zi) => {
    let x = 10
    z.split(' ').filter(Boolean).forEach((t) => {
      const c = typeof conf === 'function' ? conf(t) : conf
      out.push({ text: t, conf: c, bbox: { x0: x, y0: zi * 30, x1: x + t.length * 8, y1: zi * 30 + 16 } })
      x += t.length * 8 + 12
    })
  })
  return out
}
const zeilenAus = (z, conf) => gruppiereZeilen(woerter(z, conf))
const SOLL = [{ la: '1000', bez: 'Grundgehalt' }, { la: '1641', bez: 'On-Site-Zulage' }, { la: '5040', bez: 'Taggeld' }]

test('Zahlenformat: österreichische Beträge', () => {
  assert.equal(parseBetrag('1.234,56'), 1234.56)
  assert.equal(parseBetrag('1 234,56'), 1234.56)
  assert.equal(parseBetrag('1 234,56'), 1234.56)
  assert.equal(parseBetrag('12.345.678,90'), 12345678.9)
  assert.equal(parseBetrag('0,05'), 0.05)
  assert.equal(parseBetrag('283,82'), 283.82)
  assert.equal(parseBetrag('€ 3.400,00'), 3400)
  assert.equal(parseBetrag('3.400,00 EUR'), 3400)
})

test('Zahlenformat: negative Beträge in allen üblichen Schreibweisen', () => {
  assert.equal(parseBetrag('-946,62'), -946.62)
  assert.equal(parseBetrag('−946,62'), -946.62)
  assert.equal(parseBetrag('946,62-'), -946.62)
  assert.equal(parseBetrag('(946,62)'), -946.62)
  assert.equal(parseBetrag('-1.234,56'), -1234.56)
  assert.equal(parseBetrag('-946,62-'), null, 'doppeltes Vorzeichen')
})

test('Zahlenformat: fehlerhafte OCR-Ergebnisse werden nicht geraten', () => {
  for (const s of ['1.2O4,56', '1,234,56', '12.34,56', '1234.56', '1.234', '1.234,5', '1.234,567', 'l.234,56', '1.234 567,89', '', '—', 'Netto']) {
    assert.equal(parseBetrag(s), null, s)
  }
  assert.equal(parseBetrag('1.234 567,89'), null, 'gemischte Tausendertrennzeichen')
})

test('Rundung: Beträge auf Cent, keine Gleitkomma-Reste', () => {
  assert.equal(parseBetrag('0,10') + parseBetrag('0,20'), 0.30000000000000004)
  const v = vergleiche({ zeilen: [{ la: '1', bez: 'a', betrag: 0.3 }], brutto: 0, sv: 0, lst: 0, netto: 0 }, { werte: { 1: parseBetrag('0,10') + parseBetrag('0,20') } }, { position: 0, summe: 0 })
  assert.equal(v.zeilen[0].diff, 0)
  assert.equal(v.zeilen[0].status, 'ok')
})

test('Zeilen: Menge × Satz bestimmt den Betrag, sonst mehrdeutig', () => {
  const [z] = zeilenAus(['1641 On-Site-Zulage 148,00 1,40 207,20'])
  const { betraege, ganzzahlen } = zahlenInZeile(z, 1)
  const a = waehleBetrag(betraege, ganzzahlen)
  assert.equal(a.status, 'eindeutig')
  assert.equal(a.betrag.wert, 207.2)
  const [t] = zeilenAus(['5040 Taggeld 15 45,00 675,00'])
  assert.equal(waehleBetrag(...Object.values(zahlenInZeile(t, 1))).betrag.wert, 675)
  const [m] = zeilenAus(['1000 Grundgehalt 3.400,00 3.500,00'])
  assert.equal(waehleBetrag(...Object.values(zahlenInZeile(m, 1))).status, 'mehrdeutig')
})

test('Zeilen: Tausender mit Leerzeichen über zwei OCR-Wörter', () => {
  const w = [
    { text: 'Netto', conf: 95, bbox: { x0: 0, y0: 0, x1: 40, y1: 16 } },
    { text: '4', conf: 95, bbox: { x0: 200, y0: 0, x1: 208, y1: 16 } },
    { text: '078,06', conf: 95, bbox: { x0: 212, y0: 0, x1: 260, y1: 16 } },
  ]
  const [z] = gruppiereZeilen(w)
  assert.deepEqual(zahlenInZeile(z).betraege.map((b) => b.wert), [4078.06])
  w[2].bbox.x0 = 400; w[2].bbox.x1 = 450   // weit auseinander → keine Zusammenführung
  assert.deepEqual(zahlenInZeile(gruppiereZeilen(w)[0]).betraege.map((b) => b.wert), [78.06])
})

test('Auswertung: eindeutige Positionen, fehlende Positionen, Abzüge mit Minus', () => {
  const zeilen = zeilenAus([
    'Abrechnung Oktober 2026',
    '1000 Grundgehalt 3.400,00',
    '5040 Taggeld 15 45,00 675,00',
    'Brutto 4.075,00',
    'Sozialversicherung -736,35',
    'Lohnsteuer 452,10-',
    'Netto 2.886,55',
  ])
  const { felder, zeitraeume } = werteAus(zeilen, SOLL)
  const f = Object.fromEntries(felder.map((x) => [x.key, x]))
  assert.equal(f['1000'].wert, 3400); assert.equal(f['1000'].status, 'erkannt')
  assert.equal(f['5040'].wert, 675)
  assert.equal(f['1641'].status, 'fehlt'); assert.equal(f['1641'].wert, null)
  assert.equal(f.sv.wert, 736.35); assert.match(f.sv.hinweis, /Abzug/)
  assert.equal(f.lst.wert, 452.1)
  assert.equal(f.brutto.wert, 4075)
  assert.equal(f.netto.wert, 2886.55)
  assert.deepEqual(zeitraeume.map((z) => z.key), ['2026-10'])
})

test('Auswertung: Bemessungsgrundlagen werden nicht als Abzug gelesen', () => {
  const { felder, unzugeordnet } = werteAus(zeilenAus(['Lohnsteuer-Bemessungsgrundlage 3.000,00', 'Lohnsteuer 283,82']), SOLL)
  assert.equal(felder.find((x) => x.key === 'lst').wert, 283.82)
  assert.equal(unzugeordnet.length, 1)
})

test('Auswertung: mehrdeutige Treffer werden nicht geraten', () => {
  const { felder } = werteAus(zeilenAus(['Netto 2.886,55', 'Auszahlung 2.850,00', '1000 Grundgehalt 1.700,00', '1000 Grundgehalt 1.700,00 ', '5040 Taggeld 300,00', '5040 Taggeld 375,00']), SOLL)
  const f = Object.fromEntries(felder.map((x) => [x.key, x]))
  assert.equal(f.netto.status, 'mehrdeutig'); assert.equal(f.netto.wert, null)
  assert.deepEqual(f.netto.kandidaten.map((k) => k.wert), [2886.55, 2850])
  assert.equal(f['1000'].status, 'erkannt', 'gleicher Betrag zweimal ist eindeutig')
  assert.equal(f['5040'].status, 'mehrdeutig')
  assert.ok(f['5040'].kandidaten.some((k) => k.wert === 675 && /Summe/.test(k.text)), 'Summe wird nur als Auswahl angeboten')
})

test('Auswertung: unsichere OCR und unlesbare Beträge werden gekennzeichnet', () => {
  const conf = (t) => (t === '3.400,00' ? 52 : 95)
  const { felder } = werteAus(zeilenAus(['1000 Grundgehalt 3.400,00', '5040 Taggeld 6?5,0O'], conf), SOLL)
  const f = Object.fromEntries(felder.map((x) => [x.key, x]))
  assert.equal(f['1000'].status, 'unsicher'); assert.equal(f['1000'].wert, 3400)
  assert.equal(f['5040'].status, 'fehlt'); assert.equal(f['5040'].wert, null)
  assert.match(f['5040'].hinweis, /kein Betrag lesbar/)
})

test('Auswertung: Störzeichen nach dem Betrag → lesbar, aber immer unsicher', () => {
  const { felder } = werteAus(zeilenAus(['1000 Grundgehalt 3.400,00.', "5040 Taggeld 675,00'", '1641 On-Site 207,2O.']), SOLL)
  const f = Object.fromEntries(felder.map((x) => [x.key, x]))
  assert.equal(f['1000'].wert, 3400); assert.equal(f['1000'].status, 'unsicher')
  assert.equal(f['5040'].wert, 675); assert.equal(f['5040'].status, 'unsicher')
  assert.equal(f['1641'].wert, null, 'Buchstabe statt Ziffer bleibt unlesbar')
})

test('Auswertung: unbekannte Lohnarten und leere OCR', () => {
  const { felder, unzugeordnet } = werteAus(zeilenAus(['7777 Sonstiges 120,00']), SOLL)
  assert.equal(unzugeordnet[0].code, '7777')
  assert.ok(felder.every((f) => f.status === 'fehlt'))
  const leer = werteAus([], SOLL)
  assert.ok(leer.felder.every((f) => f.status === 'fehlt' && f.wert === null))
  assert.deepEqual(leer.zeitraeume, [])
})

test('Zeitraum: Monatsnamen und Zahlenformen, aber keine vollständigen Daten', () => {
  assert.deepEqual(erkenneZeitraeume('Abrechnung für November 2026').map((z) => z.key), ['2026-11'])
  assert.deepEqual(erkenneZeitraeume('Jänner 2027').map((z) => z.key), ['2027-01'])
  assert.deepEqual(erkenneZeitraeume('Zeitraum 11/2026').map((z) => z.key), ['2026-11'])
  assert.deepEqual(erkenneZeitraeume('Eintritt 01.03.2020').map((z) => z.key), [])
  assert.equal(erkenneZeitraeume('Oktober 2026 … 11/2026').length, 2)
})

test('Vergleich: Soll, Ist und exakte Differenz, Toleranz verschleiert nichts', () => {
  const soll = { zeilen: [{ la: '1000', bez: 'Grundgehalt', betrag: 3400 }, { la: '5040', bez: 'Taggeld', betrag: 675 }], brutto: 4075, sv: 736.35, lst: 452.1, netto: 2886.55 }
  const v = vergleiche(soll, { werte: { 1000: 3400.03, brutto: 4075, sv: 736.35, lst: 460, netto: 2878.62 }, zusatz: [{ name: 'Sachbezug', betrag: 50 }] }, { position: 0.05, summe: 1 })
  const z = Object.fromEntries(v.zeilen.map((x) => [x.key, x]))
  assert.equal(z['1000'].status, 'ok'); assert.equal(z['1000'].diff, 0.03, 'Differenz bleibt sichtbar')
  assert.equal(z['5040'].status, 'kein-ist')
  assert.equal(z.lst.status, 'abweichung'); assert.equal(z.lst.diff, 7.9)
  assert.equal(z.netto.diff, -7.93)
  assert.equal(z.zusatz0.status, 'nur-ist')
  assert.equal(v.abweichungen, 2)
})

test('Konfiguration: als ungeprüft gekennzeichnet, keine Koordinaten', () => {
  assert.equal(KONFIGURATION.geprueft, false)
  assert.ok(!JSON.stringify(KONFIGURATION, (k, v) => (v instanceof RegExp ? String(v) : v)).match(/"(x|y|x0|y0|left|top)"/))
})
