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

// ── Layout „Abrechnungsbeleg“ – SYNTHETISCHE Testdaten mit der Struktur eines echten Belegs ──
// Spaltenköpfe rechtsbündig: Einheiten | Satz / BMG | Abzüge | Bezüge. Alle Namen und Beträge erfunden.
import { werteAusDokument, zellen, erkenneLayout, parseBetragUnsicher } from '../lohnzettel/parser.mjs'
const K = { code: [60, 85], bez: [95, 260], einheiten: [300, 340], satz: [360, 410], abzuege: [455, 490], bezuege: [530, 570] }
function beleg(seiten) {
  const w = []
  seiten.forEach((zeilen, si) => zeilen.forEach((z, zi) => {
    const y = 100 + zi * 14
    for (const [text, sp] of z) {
      const [a, b] = Array.isArray(sp) ? sp : K[sp]
      const breite = text.length * 5
      const rechts = ['einheiten', 'satz', 'abzuege', 'bezuege'].includes(sp)   // Zahlen rechtsbündig
      w.push({ text, conf: 100, seite: si + 1, bbox: { x0: rechts ? b - breite : a, y0: y - 10, x1: rechts ? b : a + breite, y1: y } })
    }
  }))
  return w
}
const kopf = [['A B R E C H N U N G S B E L E G', [50, 300]]]
const spaltenKopf = [['Lohnart Bezeichnung', [55, 150]], ['Einheiten', 'einheiten'], ['Satz / BMG', 'satz'], ['Abzüge', 'abzuege'], ['Bezüge', 'bezuege']]
const seiteRollung = [kopf, [['Summe aller Rollungsmonate 2026', [50, 250]]], spaltenKopf,
  [['1060', 'code'], ['01*HO Pauschale frei', 'bez'], ['2,00-', 'einheiten'], ['1,00', 'satz'], ['2,00-', 'bezuege']],
  [['1060', 'code'], ['02*HO Pauschale frei', 'bez'], ['4,00', 'einheiten'], ['1,00', 'satz'], ['4,00', 'bezuege']],
  [['1520', 'code'], ['02*ÜStd.Zuschl.100%(68/1)', 'bez'], ['8,00', 'einheiten'], ['20,00', 'satz'], ['160,00', 'bezuege']],
  [['5040', 'code'], ['02*Taggeld Ausl. frei', 'bez'], ['70,60', 'bezuege']],
  [['5041', 'code'], ['02*Taggeld Ausl. pfl.', 'bez'], ['29,40', 'bezuege']],
  [['1641', 'code'], ['12*On-Site Zulage', 'bez'], ['10,00', 'einheiten'], ['1,40', 'satz'], ['14,00', 'bezuege']],
  [['9200', 'code'], ['02*MV Bemessung gesamt', 'bez'], ['300,00', 'satz']],
  [['Summe Bezüge', [418, 492]], ['196,00', 'bezuege']],
  [['SV Gesamt', [491, 540]]], [['30,00-', 'bezuege']],
  [['LSt lfd', [491, 530]]], [['20,00-', 'bezuege']],
  [['Auszahlung', [434, 490]]],
  [['Jahressummen', [53, 120]]], [['SV Gesamt', [491, 540]]], [['999,99-', 'bezuege']]]
const seiteLaufend = [kopf, [['für den Zeitraum März 2026', [50, 250]]], spaltenKopf,
  [['1000', 'code'], ['Gehalt', 'bez'], ['3.000,00', 'bezuege']],
  [['8022', 'code'], ['Zukunfts. § 3/15', 'bez'], ['30,00', 'satz']],
  [['8023', 'code'], ['Bez. Umwandl. § 3/15', 'bez'], ['30,00-', 'abzuege']],
  [['Summe Bezüge', [418, 492]], ['3.000,00', 'bezuege']],
  [['SV Gesamt', [491, 540]]], [['540,00-', 'bezuege']],
  [['LSt lfd', [491, 530]]], [['300,00-', 'bezuege']],
  [['Differenz aus Vormonaten', [403, 480]]], [['146,00', [430, 480]]],
  [['Auszahlung', [434, 490]], ['2.281,00', 'bezuege']],
  [['Dienstgeberanteile', [53, 130]]], [['SV Gesamt', [491, 540]]], [['888,88', 'bezuege']]]
const SOLL_FEB = ['1000', '1520', '1641', '5040', '9010'].map((la) => ({ la, bez: 'LA ' + la }))
const feld = (e, k) => e.felder.find((f) => f.key === k)

test('Beleg: Layout wird erkannt, Zellen bleiben zusammen', () => {
  const w = beleg([seiteLaufend])
  assert.ok(erkenneLayout(gruppiereZeilen(w).map((z) => z.text).join('\n')))
  assert.equal(erkenneLayout('Netto 1.000,00'), null)
  const z = gruppiereZeilen([{ text: 'Summe', conf: 90, bbox: { x0: 0, y0: 0, x1: 30, y1: 10 } }, { text: 'Bezüge', conf: 90, bbox: { x0: 34, y0: 0, x1: 70, y1: 10 } }, { text: '1,00', conf: 90, bbox: { x0: 200, y0: 0, x1: 220, y1: 10 } }])[0]
  assert.deepEqual(zellen(z).map((c) => c.text), ['Summe Bezüge', '1,00'])
})

test('Beleg: Positionen des Arbeitsmonats aus der Aufrollung, Aliase addiert, Spalten richtig', () => {
  const e = werteAusDokument(beleg([seiteRollung, seiteLaufend]), SOLL_FEB, { arbeitsMonat: { key: '2026-02' } })
  assert.match(e.layout, /Abrechnungsbeleg/)
  assert.deepEqual(e.zeitraeume.map((z) => z.key), ['2026-03'])
  assert.equal(feld(e, '1520').wert, 160, 'Bezüge-Spalte, nicht Satz oder Einheiten')
  assert.equal(feld(e, '5040').wert, 100, '5040 + 5041')
  assert.match(feld(e, '5040').hinweis, /5040 \+ 5041/)
  assert.equal(feld(e, '9010').wert, 4, 'Alias 1060 → 9010, nur Februar')
  assert.equal(feld(e, '1000').wert, 3000)
  assert.match(feld(e, '1000').hinweis, /laufender Monat/)
  assert.equal(feld(e, '1641').wert, null, 'On-Site nur im Dezember des Vorjahres')
  assert.ok(e.andereMonate.some((u) => u.code === '1060' && u.betraege[0] === -2 && /Jänner 2026/.test(u.grund)))
  assert.ok(e.andereMonate.some((u) => u.code === '1641' && /Dezember 2025/.test(u.grund)), 'Kennung 12* im März → Vorjahr')
  assert.ok(e.unzugeordnet.some((u) => u.code === '8023' && u.betraege[0] === -30 && u.art === 'Abzug'))
  assert.ok(!e.unzugeordnet.some((u) => ['8022', '9200'].includes(u.code)), 'nur Bemessungsgrundlage bzw. Dienstgeber')
})

test('Beleg: Summen aus dem Raster, Jahres- und Dienstgeberwerte ausgeschlossen', () => {
  const e = werteAusDokument(beleg([seiteRollung, seiteLaufend]), SOLL_FEB, { arbeitsMonat: { key: '2026-02' } })
  assert.equal(feld(e, 'brutto').wert, 3196)
  assert.equal(feld(e, 'sv').wert, 570, 'Vorzeichen entfernt, Seiten addiert, Jahressumme 999,99 ignoriert')
  assert.equal(feld(e, 'lst').wert, 320)
  assert.equal(feld(e, 'netto').wert, 2281, 'leeres Auszahlungsfeld der Aufrollung zählt nicht')
  for (const k of ['brutto', 'sv', 'lst', 'netto']) assert.equal(feld(e, k).eingeschraenkt, true, k)
  const ohneDifferenz = seiteLaufend.filter((z) => !['Differenz aus Vormonaten', '146,00'].includes(z[0][0]))
  const nurLaufend = werteAusDokument(beleg([ohneDifferenz]), SOLL_FEB, { arbeitsMonat: { key: '2026-03' } })
  assert.equal(feld(nurLaufend, 'sv').eingeschraenkt, false, 'Beleg ohne Aufrollung ist direkt vergleichbar')
})

test('Beleg: unlesbarer Betrag wird nicht geraten', () => {
  const kaputt = seiteLaufend.map((z) => (z[0][0] === '1000' ? [['1000', 'code'], ['Gehalt', 'bez'], ['3.0O0,00', 'bezuege']] : z))
  const e = werteAusDokument(beleg([kaputt]), SOLL_FEB, { arbeitsMonat: { key: '2026-03' } })
  assert.equal(feld(e, '1000').wert, null)
  assert.match(feld(e, '1000').hinweis, /nicht lesbar/)
})

test('Vergleich: eingeschränkt vergleichbare Summen sind keine Abweichung', () => {
  const v = vergleiche({ zeilen: [], brutto: 0, sv: 500, lst: 0, netto: 0 }, { werte: { sv: 570 }, eingeschraenkt: ['sv'] }, { position: 0.05, summe: 1 })
  assert.equal(v.zeilen.find((z) => z.key === 'sv').status, 'eingeschraenkt')
  assert.equal(v.zeilen.find((z) => z.key === 'sv').diff, 70)
  assert.equal(v.abweichungen, 0)
})

test('OCR-Korrektur nur bei eindeutigen Fällen und immer als unsicher', () => {
  assert.deepEqual(parseBetragUnsicher('180,40'), { wert: 180.4, unsicher: false })
  assert.deepEqual(parseBetragUnsicher('180.40'), { wert: 180.4, unsicher: true }, 'Punkt statt Komma')
  assert.deepEqual(parseBetragUnsicher('1.234.56'), { wert: 1234.56, unsicher: true })
  assert.deepEqual(parseBetragUnsicher('0.00‘'), { wert: 0, unsicher: true })
  assert.deepEqual(parseBetragUnsicher('512,77-'), { wert: -512.77, unsicher: false })
  for (const s of ['4.512', '1234', '12.3', '1.2O4,56', '25,0', '2.50.20']) assert.equal(parseBetragUnsicher(s).wert, null, s)
})

test('Beleg per Texterkennung: Linienreste, verklebte Zellen, verlesene Kennungen', () => {
  const ocr = (seite) => seite.map((z) => z.map(([t, sp]) => [t
    .replace(/^02\*/, '02°').replace(/^Summe Bezüge$/, '|Summe Bezüge|').replace(/^LSt lfd$/, 'LSt Ifd'), sp]))
  const verklebt = (seite) => seite.map((z) => (z[0][0] === '1520' ? [['1520 |' + z[1][0], [60, 260]], ...z.slice(2)] : z))
  const s1 = verklebt(ocr(seiteRollung)).map((z) => z.map(([t, sp]) => [t === '4,00' && sp === 'bezuege' ? '4.00' : t, sp]))
  const w = beleg([s1, ocr(seiteLaufend)]).map((x) => ({ ...x, conf: 90 }))
  const e = werteAusDokument(w, SOLL_FEB, { arbeitsMonat: { key: '2026-02' } })
  assert.match(e.layout, /Abrechnungsbeleg/)
  assert.equal(feld(e, '1520').wert, 160, 'Code und Bezeichnung getrennt, Kennung 02° erkannt')
  assert.match(feld(e, '1520').hinweis, /Februar 2026/)
  assert.equal(feld(e, '9010').wert, 4); assert.equal(feld(e, '9010').status, 'unsicher', 'Punkt statt Komma')
  assert.equal(feld(e, 'brutto').wert, 3196)
  assert.equal(feld(e, 'lst').wert, 320, '„Ifd“ statt „lfd“')
})

test('Beleg: Summe fehlt auf einer Seite → keine Teilsumme', () => {
  const ohneSV = seiteRollung.filter((z) => !(z[0][0] === 'SV Gesamt' || z[0][0] === '30,00-'))
  const e = werteAusDokument(beleg([ohneSV, seiteLaufend]), SOLL_FEB, { arbeitsMonat: { key: '2026-02' } })
  assert.equal(feld(e, 'sv').wert, null)
  assert.match(feld(e, 'sv').hinweis, /1 von 2 Seiten/)
  assert.equal(feld(e, 'lst').wert, 320, 'andere Summen unberührt')
})

test('Beleg: Linienreste zwischen Spalten stören die Beträge nicht', () => {
  const mitStrich = seiteLaufend.map((z) => (z[0][0] === '1000' ? [...z, ['|', [500, 503]]] : z))
  const e = werteAusDokument(beleg([mitStrich]), SOLL_FEB, { arbeitsMonat: { key: '2026-03' } })
  assert.equal(feld(e, '1000').wert, 3000)
})

test('Schräglage: Zeilenprofil findet den Drehwinkel synthetischer Textzeilen', async () => {
  const { schaetzeSchraeglage } = await import('../lohnzettel/ocr.mjs')
  for (const grad of [0, 1.6, -2.4]) {
    const a = (grad * Math.PI) / 180, p = []
    for (let zeile = 0; zeile < 30; zeile++) for (let x = 0; x < 600; x += 3) if ((x / 3 + zeile) % 4) {
      const y = 20 + zeile * 25
      p.push(Math.round(x * Math.cos(a) - y * Math.sin(a)), Math.round(x * Math.sin(a) + y * Math.cos(a)))
    }
    assert.ok(Math.abs(schaetzeSchraeglage(p) - grad) <= 0.2, `${grad}° → ${schaetzeSchraeglage(p)}`)
  }
})

test('Beleg: Jahreswerte werden nie zu Monatswerten addiert', () => {
  // Überschrift „Jahressummen“ mit OCR-Störzeichen davor
  const gestoert = seiteLaufend.map((z) => (z[0][0] === 'Dienstgeberanteile' ? [['5 Jahressummen', [53, 130]]] : z))
  let e = werteAusDokument(beleg([gestoert]), SOLL_FEB, { arbeitsMonat: { key: '2026-03' } })
  assert.equal(feld(e, 'sv').wert, 540)
  // Abschnittsüberschrift gar nicht erkannt → SV Gesamt zweimal auf der Seite → mehrdeutig statt Summe
  const ohneEnde = seiteLaufend.filter((z) => z[0][0] !== 'Dienstgeberanteile')
  e = werteAusDokument(beleg([ohneEnde]), SOLL_FEB, { arbeitsMonat: { key: '2026-03' } })
  assert.equal(feld(e, 'sv').wert, null)
  assert.equal(feld(e, 'sv').status, 'mehrdeutig')
  assert.deepEqual(feld(e, 'sv').kandidaten.map((k) => k.wert), [540, 888.88])
})

test('Beleg: nur die Aufrollungsseite – Monat und Jahr aus ihren eigenen Angaben', () => {
  const nurRollung = seiteRollung.map((z) => (z[0][0] === 'Summe aller Rollungsmonate 2026' ? [['Summe aller Rollungsmonate 2026', [50, 250]]] : z))
  nurRollung.splice(2, 0, [['Abrechnungsmonat März', [50, 200]]])
  const e = werteAusDokument(beleg([nurRollung]), SOLL_FEB, { arbeitsMonat: { key: '2026-02' } })
  assert.equal(feld(e, '1520').wert, 160)
  assert.equal(feld(e, '5040').wert, 100)
  assert.deepEqual(e.zeitraeume.map((z) => z.key), ['2026-03'])
})

test('Auswahl: ein PDF oder mehrere Fotos, Grenzen werden geprüft', async () => {
  const { pruefeAuswahl } = await import('../lohnzettel/ocr.mjs')
  const datei = (name, type, mb = 1) => ({ name, type, size: mb * 1024 * 1024 })
  assert.equal(pruefeAuswahl([datei('a.pdf', 'application/pdf')]).typ, 'pdf')
  assert.equal(pruefeAuswahl([datei('s1.jpg', 'image/jpeg'), datei('s2.jpg', 'image/jpeg')]).liste.length, 2)
  assert.match(pruefeAuswahl([datei('a.pdf', 'application/pdf'), datei('s1.jpg', 'image/jpeg')]).fehler, /entweder/)
  assert.match(pruefeAuswahl(Array.from({ length: 6 }, (_, i) => datei(i + '.png', 'image/png'))).fehler, /Höchstens 5/)
  assert.match(pruefeAuswahl([datei('a.jpg', 'image/jpeg', 10), datei('b.jpg', 'image/jpeg', 10)]).fehler, /zusammen größer/)
  assert.match(pruefeAuswahl([datei('a.docx', 'application/msword')]).fehler, /Nur PDF/)
  assert.match(pruefeAuswahl([]).fehler, /Keine Datei/)
})

test('Beleg: nur eine von zwei Seiten gelesen → Hinweis, Summen eingeschränkt', () => {
  const e = werteAusDokument(beleg([seiteLaufend]), SOLL_FEB, { arbeitsMonat: { key: '2026-02' } })
  assert.match(e.hinweise.join(' '), /Aufrollungsseite wurde aber nicht gelesen/)
  assert.equal(feld(e, 'brutto').eingeschraenkt, true)
})

test('Beleg: verlesene Abschnittsüberschrift „Jahres sa“ beendet den Monatsbereich', () => {
  const gestoert = seiteLaufend.map((z) => (z[0][0] === 'Dienstgeberanteile' ? [['Jahres sa', [53, 130]]] : z))
  assert.equal(feld(werteAusDokument(beleg([gestoert]), SOLL_FEB, { arbeitsMonat: { key: '2026-03' } }), 'sv').wert, 540)
})

test('Beleg: Zeilen unter „Summe Bezüge“ sind keine Positionen', () => {
  const mitWertzeile = [...seiteLaufend]
  mitWertzeile.splice(mitWertzeile.findIndex((z) => z[0][0] === 'Summe Bezüge') + 1, 0, [['742', 'code'], ['134,11', [200, 240]], ['134,11-', 'bezuege']])
  const e = werteAusDokument(beleg([mitWertzeile]), SOLL_FEB, { arbeitsMonat: { key: '2026-03' } })
  assert.ok(!e.unzugeordnet.some((u) => u.code === '742'))
})

// ── Zeitnachweis – SYNTHETISCHE Testdaten mit der Struktur eines Zeitnachweises ──
import { werteZeitnachweisAus, parseStdMin, parseUhrzeit } from '../lohnzettel/zeitnachweis.mjs'
const ZK = { tag: [50, 73], kommt: [71, 92], geht: [100, 114], tp: [119, 139], gesamt: [147, 169], soll: [180, 191], saldo: [200, 213], u50: [224, 235], abw: [307, 321], komm: [335, 371] }
function zeitnachweis(zeilen) {
  const w = []
  zeilen.forEach((z, zi) => {
    const y = 100 + zi * 8
    for (const [text, sp] of z) { const [a, b] = Array.isArray(sp) ? sp : ZK[sp]; w.push({ text, conf: 100, seite: 1, bbox: { x0: a, y0: y - 6, x1: b, y1: y } }) }
  })
  return w
}
const zKopf = [[['Zeitnachweis', [294, 329]]], [['Periode:', [267, 289]], ['01-03-2026', [291, 322]], ['-', [324, 326]], ['31-03-2026', [327, 358]]],
  [['Kommt', 'kommt'], ['Geht', 'geht'], ['TP', [119, 127]], ['Gesamt', 'gesamt'], ['Soll', 'soll'], ['+/-', [206, 213]], ['U50', 'u50'], ['ABW', 'abw'], ['§68/2Komm.', 'komm']]]

test('Zeitnachweis: Stunden als Stunden,Minuten und Uhrzeiten', () => {
  assert.equal(parseStdMin('8,15'), 8.25)
  assert.equal(parseStdMin('-8,15'), -8.25)
  assert.equal(parseStdMin('10,30'), 10.5)
  assert.equal(parseStdMin('8,75'), null)          // keine gültige Minutenangabe
  assert.equal(parseUhrzeit('07:30'), 7.5)
  assert.equal(parseUhrzeit('25:00'), null)
})

test('Zeitnachweis: Tage, Tagesprogramm, Kommt/Geht und Gesamt werden über die Spaltenköpfe gelesen', () => {
  const r = werteZeitnachweisAus(zeitnachweis([...zKopf,
    [['Mo02.03', 'tag'], ['MT10A', 'tp']],
    [['Di', [50, 56]], ['03.03', [58, 73]], ['07:00', 'kommt'], ['12:00', 'geht'], ['MT10A', 'tp'], ['10,30', 'gesamt'], ['8,15', 'soll'], ['2,15', 'saldo'], ['-9,99', 'komm']],
    [['13:00', 'kommt'], ['18:30', 'geht']],
    [['Mi 04.03', [50, 73]], ['UR', 'abw']],                         // PDF-Textebene: Tag und Datum als ein Wort
    [['Do', [50, 58]], ['05.03', [58, 73]], ['08:00', 'kommt'], ['14:30', 'geht']],
    [['Fr', [50, 56]], ['06.03', [58, 73]], ['8,75', 'gesamt']],
    [['Wochensumme', [50, 92]], ['10,30', 'gesamt']]]))
  assert.equal(r.erkannt, true)
  assert.deepEqual(r.periode, { von: { t: 1, m: 3, j: 2026 }, bis: { t: 31, m: 3, j: 2026 } })
  assert.deepEqual(r.tage.map((t) => t.key), ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'])
  const [mo, di, mi, d, fr] = r.tage
  assert.equal(mo.tp, 'MT10A'); assert.equal(mo.stunden, null)
  assert.equal(di.stunden, 10.5)                    // Spalte Gesamt hat Vorrang
  assert.deepEqual(di.kommt, [7, 13]); assert.deepEqual(di.geht, [12, 18.5])   // zweites Paar aus der Folgezeile
  assert.equal(di.soll, 8.25); assert.equal(di.saldo, 2.25)
  assert.equal(di.abw, '')                          // Wert der Spalte „§68/2Komm.“ landet nirgends
  assert.equal(mi.abw, 'UR')
  assert.equal(d.stunden, 6.5)                      // ohne Gesamt: Geht − Kommt
  assert.equal(fr.stunden, null); assert.ok(fr.unsicher.length)   // „8,75“ wird nicht geraten
})

test('Zeitnachweis: Jahr über den Zeitraum, andere Dokumente werden nicht erkannt', () => {
  const kopf = [zKopf[0], [['Periode:', [267, 289]], ['28-12-2026', [291, 322]], ['-', [324, 326]], ['03-01-2027', [327, 358]]], zKopf[2]]
  const r = werteZeitnachweisAus(zeitnachweis([...kopf, [['Mo28.12', 'tag'], ['MT10A', 'tp']], [['Fr', [50, 56]], ['01.01', [58, 73]], ['FT8', 'tp']]]))
  assert.deepEqual(r.tage.map((t) => t.key), ['2026-12-28', '2027-01-01'])
  assert.equal(werteZeitnachweisAus(zeitnachweis([[['Abrechnungsbeleg', [50, 120]]], [['Gehalt', [60, 90]], ['3.000,00', [530, 570]]]])).erkannt, false)
})
