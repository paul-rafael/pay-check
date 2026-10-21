// Parser für erkannte Lohnzettel-Texte – reine Funktionen ohne Browser-Abhängigkeit.
// Eingabe sind Wörter mit Position und Konfidenz (aus Tesseract oder der PDF-Textebene).
// Grundsatz: nichts raten. Was nicht eindeutig ist, wird als „mehrdeutig“, „unsicher“ oder „fehlt“
// gekennzeichnet und im Kontrollfenster vom Nutzer entschieden.
import { KONFIGURATION, MONATSNAMEN } from './konfiguration.mjs'

const r2 = (n) => Math.round(n * 100) / 100

// ── Zahlenformat ─────────────────────────────────────────────────────────────
// Österreichisches Format: Tausenderpunkt (oder Leerzeichen), Dezimalkomma, genau zwei Nachkommastellen.
// Vorzeichen vorne (-, −, –), hinten (1.234,56-) oder als Klammer (1.234,56). Alles andere → null.
const BETRAG = /^(?<vor>[-−–])?(?<zahl>\d{1,3}(?:[.   ]\d{3})+|\d+),(?<dez>\d{2})(?<nach>-)?$/
export function parseBetrag(raw) {
  if (raw == null) return null
  let s = String(raw).trim().replace(/^(€|EUR)\s*/i, '').replace(/\s*(€|EUR)$/i, '').trim()
  let klammer = false
  if (/^\(.*\)$/.test(s)) { klammer = true; s = s.slice(1, -1).trim() }
  const m = s.match(BETRAG)
  if (!m) return null
  const { vor, zahl, dez, nach } = m.groups
  if ([vor, nach, klammer || undefined].filter(Boolean).length > 1) return null   // doppeltes Vorzeichen
  // Tausendergruppen müssen einheitlich getrennt sein
  const trenner = new Set(zahl.match(/[.   ]/g) || [])
  if (trenner.size > 1) return null
  const wert = Number(zahl.replace(/[.   ]/g, '') + '.' + dez)
  return r2(vor || nach || klammer ? -wert : wert)
}
// Ganze Zahl (Menge, Tage) für die Plausibilitätsprüfung Menge × Satz = Betrag
const GANZZAHL = /^\d{1,4}$/
const STOERZEICHEN_KONF = 50

// ── Zeilen bilden ────────────────────────────────────────────────────────────
// Wörter nach senkrechter Überlappung zu Zeilen gruppieren (unabhängig von der Segmentierung der OCR)
export function gruppiereZeilen(woerter) {
  const w = woerter.filter((x) => x && x.text && String(x.text).trim() && x.bbox)
    .map((x) => ({ ...x, text: String(x.text).trim(), cy: (x.bbox.y0 + x.bbox.y1) / 2, h: Math.max(1, x.bbox.y1 - x.bbox.y0) }))
    .sort((a, b) => a.cy - b.cy || a.bbox.x0 - b.bbox.x0)
  const zeilen = []
  for (const x of w) {
    const z = zeilen.find((l) => Math.abs(l.cy - x.cy) < Math.min(l.h, x.h) * 0.6 && (l.seite ?? 0) === (x.seite ?? 0))
    if (z) { z.woerter.push(x); z.cy = (z.cy * (z.woerter.length - 1) + x.cy) / z.woerter.length; z.h = Math.max(z.h, x.h) }
    else zeilen.push({ woerter: [x], cy: x.cy, h: x.h, seite: x.seite ?? 0 })
  }
  zeilen.forEach((z) => { z.woerter.sort((a, b) => a.bbox.x0 - b.bbox.x0); z.text = z.woerter.map((x) => x.text).join(' ') })
  return zeilen.sort((a, b) => a.seite - b.seite || a.cy - b.cy)
}

// Beträge und ganze Zahlen einer Zeile, von links nach rechts.
// Mit Leerzeichen getrennte Tausender („1 234,56“) werden zusammengeführt, wenn die Wörter direkt nebeneinander stehen.
export function zahlenInZeile(zeile, abWort = 0) {
  const w = zeile.woerter.slice(abWort), betraege = [], ganzzahlen = []
  for (let i = 0; i < w.length; i++) {
    let text = w[i].text, conf = w[i].conf ?? 100, x = w[i].bbox.x0, j = i
    // „1“ + „234,56“ → „1 234,56“, nur bei engem Abstand und solange noch kein Dezimalteil erreicht ist
    while (j + 1 < w.length && /^[-−–]?\d{1,3}( \d{3})*$/.test(text) && /^\d{3}(,\d{2}-?)?$/.test(w[j + 1].text) &&
      w[j + 1].bbox.x0 - w[j].bbox.x1 <= (w[j].bbox.y1 - w[j].bbox.y0) * 0.6) {
      text += ' ' + w[j + 1].text; conf = Math.min(conf, w[j + 1].conf ?? 100); j++
    }
    if (j > i && parseBetrag(text) == null) { text = w[i].text; conf = w[i].conf ?? 100; j = i }
    let wert = parseBetrag(text)
    // Ein einzelnes OCR-Störzeichen nach den Nachkommastellen („594,50.“) ändert die Zahl nicht –
    // der Betrag wird gelesen, gilt aber immer als unsicher und muss geprüft werden.
    if (wert == null && /\d,\d{2}-?[.'’‚,;:|]$/.test(text)) { wert = parseBetrag(text.slice(0, -1)); if (wert != null) conf = Math.min(conf, STOERZEICHEN_KONF) }
    if (wert != null) { betraege.push({ wert, text, conf, x }); i = j; continue }
    if (GANZZAHL.test(w[i].text)) ganzzahlen.push({ wert: Number(w[i].text), text: w[i].text, conf: w[i].conf ?? 100, x })
  }
  return { betraege, ganzzahlen }
}

// Betrag einer Positionszeile bestimmen. Mehrere Beträge → nur eindeutig, wenn Menge × Satz = Betrag aufgeht.
export function waehleBetrag(betraege, ganzzahlen = []) {
  if (!betraege.length) return { status: 'fehlt', kandidaten: [] }
  if (betraege.length === 1) return { status: 'eindeutig', betrag: betraege[0], kandidaten: betraege }
  const faktoren = [...betraege, ...ganzzahlen]
  const passt = betraege.filter((c) => faktoren.some((a, i) => a !== c && faktoren.some((b, k) => k !== i && b !== c &&
    Math.abs(a.wert * b.wert - c.wert) <= Math.max(0.02, Math.min(Math.abs(a.wert), Math.abs(b.wert)) * 0.005 + 0.01))))
  const werte = [...new Set(passt.map((c) => c.wert))]
  if (werte.length === 1) {
    const betrag = passt.sort((a, b) => b.x - a.x)[0]
    return { status: 'eindeutig', betrag, kandidaten: betraege, geprueft: 'Menge × Satz' }
  }
  return { status: 'mehrdeutig', kandidaten: betraege }
}

// ── Bezugszeitraum ───────────────────────────────────────────────────────────
// Liefert alle gefundenen Monat/Jahr-Angaben (ohne vollständige Datumsangaben wie 01.03.2020)
export function erkenneZeitraeume(text) {
  const funde = new Map()
  const add = (m, j) => { if (m >= 1 && m <= 12 && j >= 2000 && j <= 2099) funde.set(j + '-' + String(m).padStart(2, '0'), { monat: m, jahr: j }) }
  const namen = new RegExp('\\b(' + MONATSNAMEN.join('|') + ')\\s+(20\\d{2})\\b', 'gi')
  for (const m of text.matchAll(namen)) add(MONATSNAMEN.findIndex((n) => new RegExp('^(' + n + ')$', 'i').test(m[1])) + 1, +m[2])
  for (const m of text.matchAll(/(?<![\d.,/])(0?[1-9]|1[0-2])\s*[/.\-]\s*(20\d{2})(?![\d.,/])/g)) add(+m[1], +m[2])
  return [...funde.entries()].map(([key, v]) => ({ key, ...v }))
}

// ── Auswertung ───────────────────────────────────────────────────────────────
// zeilen: Ergebnis von gruppiereZeilen. soll: [{la, bez}] – Lohnarten des berechneten Lohnzettels.
// Liefert Felder je Lohnart und Summenfeld mit Status sowie nicht zuordenbare Zeilen.
export function werteAus(zeilen, soll, konf = KONFIGURATION) {
  const minKonf = konf.minKonfidenz
  const eintrag = (key, label, art) => ({ key, label, art, wert: null, status: 'fehlt', quelle: [], kandidaten: [], hinweis: '' })
  const felder = {}
  soll.forEach((z) => { felder[z.la] = eintrag(z.la, z.bez, 'lohnart') })
  Object.entries(konf.summen).forEach(([k, d]) => { felder[k] = eintrag(k, d.label, 'summe') })
  const unzugeordnet = []
  const treffer = {}   // key → [{ zeile, auswahl }]
  const merke = (key, zeile, auswahl) => (treffer[key] = treffer[key] || []).push({ zeile, auswahl })

  for (const zeile of zeilen) {
    const code = zeile.text.match(konf.lohnartCode)?.[1]
    if (code) {
      const { betraege, ganzzahlen } = zahlenInZeile(zeile, 1)
      if (felder[code]?.art === 'lohnart') { merke(code, zeile, waehleBetrag(betraege, ganzzahlen)); continue }
      if (betraege.length) { unzugeordnet.push({ text: zeile.text, code, betraege: betraege.map((b) => b.wert), grund: 'Lohnart nicht im berechneten Lohnzettel' }); continue }
    }
    const summe = Object.entries(konf.summen).filter(([, d]) => d.muster.some((m) => m.test(zeile.text)) && !d.ausschluss.some((m) => m.test(zeile.text)))
    const { betraege, ganzzahlen } = zahlenInZeile(zeile)
    if (summe.length === 1 && betraege.length) { merke(summe[0][0], zeile, waehleBetrag(betraege, ganzzahlen)); continue }
    if (betraege.length) unzugeordnet.push({ text: zeile.text, betraege: betraege.map((b) => b.wert), grund: summe.length > 1 ? 'passt zu mehreren Feldern' : 'keinem Feld eindeutig zuordenbar' })
  }

  for (const [key, liste] of Object.entries(treffer)) {
    const f = felder[key], def = konf.summen[key]
    f.quelle = liste.map((t) => t.zeile.text)
    const eindeutig = liste.filter((t) => t.auswahl.status === 'eindeutig')
    const werte = [...new Set(eindeutig.map((t) => t.auswahl.betrag.wert))]
    if (liste.length > 1 && (werte.length !== 1 || eindeutig.length !== liste.length)) {
      f.status = 'mehrdeutig'
      f.kandidaten = liste.flatMap((t) => t.auswahl.kandidaten.map((b) => ({ wert: b.wert, text: t.zeile.text })))
      if (f.art === 'lohnart' && eindeutig.length === liste.length) f.kandidaten.push({ wert: r2(eindeutig.reduce((s, t) => s + t.auswahl.betrag.wert, 0)), text: 'Summe aller ' + liste.length + ' Zeilen' })
      f.hinweis = liste.length + ' Zeilen gefunden – bitte richtigen Betrag wählen'
      continue
    }
    const a = liste[0].auswahl
    if (a.status !== 'eindeutig') {
      f.status = a.status
      f.kandidaten = a.kandidaten.map((b) => ({ wert: b.wert, text: liste[0].zeile.text }))
      f.hinweis = a.status === 'mehrdeutig' ? 'mehrere Beträge in der Zeile – bitte richtigen wählen' : 'Zeile gefunden, aber kein Betrag lesbar'
      continue
    }
    let wert = a.betrag.wert
    if (def?.abzug && wert < 0) { wert = -wert; f.hinweis = 'als Abzug gewertet (Vorzeichen entfernt)' }
    f.wert = wert
    f.status = a.betrag.conf < minKonf ? 'unsicher' : 'erkannt'
    if (f.status === 'unsicher') f.hinweis = 'Texterkennung unsicher (' + Math.round(a.betrag.conf) + ' %) – bitte prüfen'
    else if (a.geprueft) f.hinweis = 'Betrag über ' + a.geprueft + ' bestätigt'
    f.kandidaten = a.kandidaten.map((b) => ({ wert: b.wert, text: liste[0].zeile.text }))
  }

  const text = zeilen.map((z) => z.text).join('\n')
  return { felder: Object.values(felder), unzugeordnet, zeitraeume: erkenneZeitraeume(text), text }
}

// ── Vergleich ────────────────────────────────────────────────────────────────
// soll: {zeilen:[{la,bez,betrag}], brutto, sv, lst, netto}
// ist: {werte:{la|'brutto'|'sv'|'lst'|'netto': Zahl}, zusatz:[{name,betrag}]}
// toleranz: {position, summe}. Differenzen werden immer exakt ausgewiesen.
export function vergleiche(soll, ist, toleranz) {
  const w = ist.werte || {}, zeilen = []
  const zeile = (key, label, s, i, tol, art) => {
    const hatIst = typeof i === 'number' && Number.isFinite(i)
    const diff = hatIst ? r2(i - s) : null
    const status = !hatIst ? 'kein-ist' : Math.abs(diff) <= tol + 1e-9 ? 'ok' : 'abweichung'
    zeilen.push({ key, label, soll: s, ist: hatIst ? i : null, diff, status, art })
  }
  soll.zeilen.forEach((z) => zeile(z.la, z.bez, z.betrag, w[z.la], toleranz.position, 'lohnart'))
  ;(ist.zusatz || []).forEach((z, i) => zeilen.push({ key: 'zusatz' + i, label: z.name || 'Weitere Position', soll: null, ist: z.betrag, diff: null, status: 'nur-ist', art: 'zusatz' }))
  zeile('brutto', 'Brutto gesamt', soll.brutto, w.brutto, toleranz.summe, 'summe')
  zeile('sv', 'Sozialversicherung', soll.sv, w.sv, toleranz.summe, 'summe')
  zeile('lst', 'Lohnsteuer', soll.lst, w.lst, toleranz.summe, 'summe')
  zeile('netto', 'Netto', soll.netto, w.netto, toleranz.summe, 'summe')
  return { zeilen, abweichungen: zeilen.filter((z) => z.status === 'abweichung').length, netto: zeilen.find((z) => z.key === 'netto') }
}
