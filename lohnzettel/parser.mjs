// Parser für erkannte Lohnzettel-Texte – reine Funktionen ohne Browser-Abhängigkeit.
// Eingabe sind Wörter mit Position und Konfidenz (aus Tesseract oder der PDF-Textebene).
// Grundsatz: nichts raten. Was nicht eindeutig ist, wird als „mehrdeutig“, „unsicher“ oder „fehlt“
// gekennzeichnet und im Kontrollfenster vom Nutzer entschieden.
import { KONFIGURATION, MONATSNAMEN, LAYOUTS } from './konfiguration.mjs'

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
// Eindeutige OCR-Fehler, die die Zahl nicht verändern – Ergebnis gilt immer als unsicher:
//  - ein Störzeichen nach den Nachkommastellen („594,50.“, „0,00‘“)
//  - Punkt statt Dezimalkomma („180.40“): zwei Stellen nach dem letzten Punkt können kein Tausendertrenner sein
export function parseBetragUnsicher(raw) {
  const sicher = parseBetrag(raw)
  if (sicher != null) return { wert: sicher, unsicher: false }
  let t = String(raw ?? '').trim()
  if (/\d[.,]\d{2}-?[.'’‘‚,;:|"]$/.test(t)) t = t.slice(0, -1)
  let w = parseBetrag(t)
  if (w == null && !t.includes(',')) {
    const m = t.match(/^([-−–]?\d{1,3}(?:\.\d{3})*|[-−–]?\d+)\.(\d{2})(-?)$/)
    if (m) w = parseBetrag(m[1] + ',' + m[2] + m[3])
  }
  return w == null ? { wert: null, unsicher: false } : { wert: w, unsicher: true }
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
    const u = parseBetragUnsicher(text)
    let wert = u.wert
    if (u.unsicher) conf = Math.min(conf, STOERZEICHEN_KONF)
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

// ── Bekannte Beleg-Layouts ───────────────────────────────────────────────────
// Benachbarte Wörter einer Zeile zu Zellen zusammenfassen (Abstand < 0,8 × Zeilenhöhe)
export function zellen(zeile) {
  const out = []
  for (const w of zeile.woerter) {
    if (/^[|_—–]+$/.test(w.text)) continue   // Reste von Tabellenlinien
    const z = out[out.length - 1]
    if (z && w.bbox.x0 - z.x1 < zeile.h * 0.8) { z.text += ' ' + w.text; z.x1 = Math.max(z.x1, w.bbox.x1); z.conf = Math.min(z.conf, w.conf ?? 100) }
    else out.push({ text: w.text, x0: w.bbox.x0, x1: w.bbox.x1, conf: w.conf ?? 100 })
  }
  return out
}
// Linienreste und Satzzeichen am Rand einer Beschriftung entfernen (nur für den Vergleich mit Beschriftungen)
const normLabel = (t) => t.replace(/^[|_\-–‚'"“”‘’.,:;\s]+|[|_\-–‚'"“”‘’.,:;\s]+$/g, '').replace(/\s+/g, ' ')
const monatAusName = (n) => MONATSNAMEN.findIndex((m) => new RegExp('^(' + m + ')$', 'i').test(n)) + 1
const mkey = (m, j) => j + '-' + String(m).padStart(2, '0')
export function erkenneLayout(text, layouts = LAYOUTS) { return layouts.find((l) => l.erkennung.every((m) => m.test(text))) || null }

// Zellen eines Betrags per rechter Kante der nächstgelegenen Spaltenüberschrift zuordnen
function spalteFuer(x1, spalten) {
  const liste = Object.entries(spalten).sort((a, b) => a[1] - b[1])
  let best = null
  liste.forEach(([k, r], i) => {
    const nachbar = Math.min(...liste.filter((_, j) => j !== i).map(([, r2]) => Math.abs(r2 - r)))
    const d = Math.abs(x1 - r)
    if (d <= nachbar / 2 && (!best || d < best.d)) best = { k, d }
  })
  return best?.k ?? null
}

// Abrechnungsbeleg mit Spaltenköpfen auswerten. kontext: {arbeitsMonat:{key}}
export function werteAusBeleg(woerter, soll, kontext, L) {
  const seitenNr = [...new Set(woerter.map((w) => w.seite ?? 1))].sort((a, b) => a - b)
  const positionen = [], summen = [], textZeilen = []
  let laufend = null, ersatz = null, belegSeiten = 0
  for (const nr of seitenNr) {
    const zeilen = gruppiereZeilen(woerter.filter((w) => (w.seite ?? 1) === nr))
    const zl = zeilen.map((z) => ({ ...z, zellen: zellen(z) }))
    textZeilen.push(...zl.map((z) => z.text))
    const seitenText = zl.map((z) => z.text).join('\n')
    const ende = zl.findIndex((z) => z.zellen.some((c) => L.ende.some((m) => m.test(normLabel(c.text)))))
    const bereich = ende >= 0 ? zl.slice(0, ende) : zl
    const lm = seitenText.match(L.laufenderMonat)
    if (lm && monatAusName(lm[1])) laufend = { monat: monatAusName(lm[1]), jahr: +lm[2] }
    const am = seitenText.match(L.abrechnungsmonat), rj = seitenText.match(L.rollungsJahr)
    if (!laufend && am && rj && monatAusName(am[1])) ersatz = { monat: monatAusName(am[1]), jahr: +rj[1] }
    const rollung = L.rollungsSeite.test(seitenText)
    // Spalten aus der Kopfzeile
    const ki = bereich.findIndex((z) => L.kopfzeile.test(z.text))
    if (ki >= 0) belegSeiten++
    if (ki >= 0) {
      const spalten = {}
      for (const c of bereich[ki].zellen) for (const [k, m] of Object.entries(L.spalten)) if (m.test(normLabel(c.text))) spalten[k] = c.x1
      for (const z of bereich.slice(ki + 1)) {
        // Die Positionstabelle endet mit der ersten Summenzeile („Summe Bezüge“)
        if (z.zellen.some((c) => Object.values(L.summen).some((m) => m.test(normLabel(c.text))))) break
        let [code, bez, ...rest] = z.zellen
        // Code und Bezeichnung zusammengeklebt (z.B. „1060 |02*HO …“ bei Fotos) → wieder trennen
        const kl = code?.text.match(/^(\d{3,4})\s*\|?\s*(\D.*)$/)
        if (kl && !/^\d{3,4}$/.test(code.text)) { rest = bez ? [bez, ...rest] : rest; bez = { ...code, text: kl[2] }; code = { ...code, text: kl[1] } }
        if (!code || !/^\d{3,4}$/.test(code.text) || !bez) continue
        // Betragszellen, die irrtümlich an die Bezeichnung geklebt wurden, gibt es bei Spaltenabstand nicht – Bezeichnung bereinigen
        bez = { ...bez, text: bez.text.replace(/^[|‚'"\s]+/, '') }
        const pm = bez.text.match(L.rollung)
        const werte = {}
        let unlesbar = 0, unsicherW = false
        for (const c of rest) {
          const k = spalteFuer(c.x1, spalten)
          const u = parseBetragUnsicher(c.text)
          if (u.wert == null || !k) { if (/\d/.test(c.text)) unlesbar++; continue }
          werte[k] = u.wert
          if (u.unsicher) unsicherW = true
        }
        // Konfidenz der Betragszellen zählt; unsichere Zahlenkorrekturen gelten immer als unsicher
        const conf = Math.min(code.conf, ...rest.filter((c) => /\d/.test(c.text)).map((c) => c.conf), unsicherW ? STOERZEICHEN_KONF : 100)
        positionen.push({ code: code.text, bez: bez.text.replace(L.rollung, ''), text: z.text, rollungsMonat: pm ? +pm[1] : null, rollung, seite: nr, werte, conf, unlesbar })
      }
    }
    // Summen: Beschriftung exakt, Wert rechts daneben oder in der nächsten Zeile unter der Beschriftung
    bereich.forEach((z, i) => z.zellen.forEach((c, ci) => {
      for (const [k, m] of Object.entries(L.summen)) {
        if (!m.test(normLabel(c.text))) continue
        const rechts = z.zellen.slice(ci + 1).find((d) => parseBetragUnsicher(d.text).wert != null)
        let wert = rechts, unter = null
        if (!wert) {
          // Wert unter der Beschriftung, in deren Spalte – höchstens zwei Zeilen tiefer (Störzeilen der Texterkennung)
          const naechsteX = z.zellen[ci + 1]?.x0 ?? Infinity
          for (const n of bereich.slice(i + 1, i + 3)) {
            if (n.cy - z.cy > z.h * 3.5) break
            if (n.zellen.some((d) => Object.values(L.summen).some((m) => m.test(normLabel(d.text))))) break   // nächste Beschriftungszeile
            wert = n.zellen.find((d) => d.x0 >= c.x0 - z.h && d.x0 < naechsteX && parseBetragUnsicher(d.text).wert != null)
            if (wert) break
          }
        }
        const u = wert ? parseBetragUnsicher(wert.text) : { wert: null }
        summen.push({ key: k, wert: u.wert, conf: u.unsicher ? Math.min(wert.conf, STOERZEICHEN_KONF) : wert?.conf ?? 0, seite: nr, rollung, text: normLabel(c.text) + (wert ? ' ' + wert.text : '') })
      }
    }))
  }

  // Jahr der aufgerollten Monate: Kennung größer als der laufende Monat → Vorjahr
  const lfd = laufend || ersatz || null
  positionen.forEach((p) => {
    if (p.rollungsMonat && lfd) p.monat = mkey(p.rollungsMonat, p.rollungsMonat > lfd.monat ? lfd.jahr - 1 : lfd.jahr)
    else if (p.rollungsMonat) p.monat = null
    else p.monat = lfd ? mkey(lfd.monat, lfd.jahr) : null
    p.ziel = L.aliase[p.code] || p.code
  })

  const felder = {}, sollLA = new Set(soll.map((z) => z.la)), am = kontext?.arbeitsMonat?.key
  const eintrag = (key, label, art) => ({ key, label, art, wert: null, status: 'fehlt', quelle: [], kandidaten: [], hinweis: '' })
  soll.forEach((z) => { felder[z.la] = eintrag(z.la, z.bez, 'lohnart') })
  Object.entries(KONFIGURATION.summen).forEach(([k, d]) => { felder[k] = eintrag(k, d.label, 'summe') })
  const unzugeordnet = [], andereMonate = [], verwendet = new Set()
  const monatsName = (k) => { if (!k) return 'unbekannter Monat'; const [j, m] = k.split('-').map(Number); return MONATSNAMEN[m - 1].split('|')[0].replace(/^./, (c) => c.toUpperCase()) + ' ' + j }

  for (const la of sollLA) {
    const alle = positionen.filter((p) => p.ziel === la && !L.ignorieren.includes(p.code) && ('bezuege' in p.werte || p.unlesbar))
    if (!alle.length) continue
    // Passender Monat: aufgerollte Zeilen des Arbeitsmonats, sonst Zeilen des laufenden Monats
    let gruppe = alle.filter((p) => p.rollungsMonat && p.monat === am)
    let hinweis = ''
    if (!gruppe.length) {
      gruppe = alle.filter((p) => !p.rollungsMonat)
      if (gruppe.length && gruppe[0].monat && gruppe[0].monat !== am) hinweis = 'Bezugsmonat laut Beleg: ' + monatsName(gruppe[0].monat) + ' (laufender Monat)'
    }
    const f = felder[la]
    if (!gruppe.length) { f.hinweis = 'nur in anderen Monaten am Beleg (siehe unten)'; continue }
    gruppe.forEach((p) => verwendet.add(p))
    f.quelle = gruppe.map((p) => p.text)
    if (gruppe.some((p) => p.unlesbar || !('bezuege' in p.werte))) { f.status = 'fehlt'; f.hinweis = 'Zeile gefunden, aber Betrag nicht lesbar'; continue }
    f.wert = r2(gruppe.reduce((s, p) => s + p.werte.bezuege, 0))
    const conf = Math.min(...gruppe.map((p) => p.conf))
    f.status = conf < KONFIGURATION.minKonfidenz ? 'unsicher' : 'erkannt'
    const teile = []
    if (gruppe.length > 1) teile.push('Summe aus ' + gruppe.length + ' Zeilen (' + [...new Set(gruppe.map((p) => p.code))].join(' + ') + ')')
    if (gruppe[0].rollungsMonat) teile.push('aufgerollt aus ' + monatsName(gruppe[0].monat))
    if (hinweis) teile.push(hinweis)
    if (f.status === 'unsicher') teile.push('Texterkennung unsicher – bitte prüfen')
    f.hinweis = teile.join(' · ')
    f.kandidaten = [{ wert: f.wert, text: f.quelle.join(' + ') }]
  }
  for (const p of positionen) {
    if (verwendet.has(p) || L.ignorieren.includes(p.code)) continue
    const betrag = 'bezuege' in p.werte ? p.werte.bezuege : 'abzuege' in p.werte ? -Math.abs(p.werte.abzuege) : null
    if (betrag == null) continue   // nur Einheiten/Bemessungsgrundlage, kein Bezug oder Abzug
    const eintragU = { text: p.text, code: p.code, betraege: [betrag], monat: p.monat, art: 'bezuege' in p.werte ? 'Bezug' : 'Abzug' }
    if (sollLA.has(p.ziel)) andereMonate.push({ ...eintragU, grund: 'Bezugsmonat ' + monatsName(p.monat) + ' – gehört nicht zur Berechnung für ' + monatsName(am) })
    else unzugeordnet.push({ ...eintragU, grund: (eintragU.art === 'Abzug' ? 'Abzug' : 'Lohnart') + ' nicht in der Berechnung' + (p.rollungsMonat ? ' · ' + monatsName(p.monat) : '') })
  }

  // Summen: über alle Seiten (laufender Monat + Aufrollung)
  const hatRollung = summen.some((x) => x.rollung)
  // leere Felder (z.B. „Auszahlung“ ohne Betrag auf der Aufrollungsseite) zählen nicht, solange eine Seite einen Wert hat
  // Brutto, SV und LSt stehen auf jeder Belegseite – fehlt eine Seite, wäre die Summe unvollständig und wird nicht gebildet
  const jeSeite = ['bezuege', 'sv', 'lst']
  const summe = (k, betragsweise) => { let l = summen.filter((x) => x.key === k); if (!l.length) return null
    // Dieselbe Summenbeschriftung mehrfach mit Wert auf einer Seite → nicht eindeutig, nichts addieren
    const proSeite = {}; l.filter((x) => x.wert != null).forEach((x) => { proSeite[x.seite] = (proSeite[x.seite] || 0) + 1 })
    if (Object.values(proSeite).some((n) => n > 1)) return { l, wert: null, mehrdeutig: true }
    if (jeSeite.includes(k)) {
      const seiten = new Set(l.filter((x) => x.wert != null).map((x) => x.seite)).size
      if (seiten < belegSeiten) return { l, wert: null, fehlendeSeiten: belegSeiten - seiten }
    }
    if (l.some((x) => x.wert != null)) l = l.filter((x) => x.wert != null)
    return { l, wert: l.some((x) => x.wert == null) ? null : r2(l.reduce((s, x) => s + (betragsweise ? Math.abs(x.wert) : x.wert), 0)), conf: Math.min(...l.map((x) => x.conf)) } }
  const betragsweiseKeys = ['sv', 'lst']
  const setze = (key, sm, hinweis) => {
    const f = felder[key]; if (!sm) return
    f.quelle = sm.l.map((x) => x.text)
    if (sm.mehrdeutig) { f.status = 'mehrdeutig'; f.kandidaten = sm.l.filter((x) => x.wert != null).map((x) => ({ wert: betragsweiseKeys.includes(key) ? Math.abs(x.wert) : x.wert, text: 'Seite ' + x.seite + ': ' + x.text })); f.hinweis = 'Beschriftung mehrfach gefunden – bitte richtigen Betrag wählen'; return }
    if (sm.wert == null) { f.hinweis = sm.fehlendeSeiten ? `auf ${sm.fehlendeSeiten} von ${belegSeiten} Seiten nicht lesbar – Summe wäre unvollständig` : 'Beschriftung gefunden, aber kein Betrag lesbar'; return }
    f.wert = sm.wert; f.status = sm.conf < KONFIGURATION.minKonfidenz ? 'unsicher' : 'erkannt'
    f.hinweis = hinweis; f.eingeschraenkt = !!hinweis; f.kandidaten = [{ wert: f.wert, text: f.quelle.join(' + ') }]
  }
  const mitRoll = hatRollung ? 'Summe aus laufendem Monat und Aufrollung – nur eingeschränkt vergleichbar' : ''
  setze('brutto', summe('bezuege'), mitRoll)
  setze('sv', summe('sv', true), mitRoll)
  setze('lst', summe('lst', true), mitRoll ? mitRoll + ' (Aufrollung mit eigenem Steuersatz)' : '')
  const ausz = summe('auszahlung'), diff = summe('differenz')
  if (ausz) setze('netto', { ...ausz, l: ausz.l }, 'Auszahlungsbetrag' + (diff ? ' inkl. Differenz aus Vormonaten' : '') + (unzugeordnet.some((u) => u.art === 'Abzug') ? ' und weiterer Abzüge' : '') + ' – nur eingeschränkt vergleichbar')

  const zeitraeume = lfd ? [{ key: mkey(lfd.monat, lfd.jahr), monat: lfd.monat, jahr: lfd.jahr }] : erkenneZeitraeume(textZeilen.join('\n'))
  // Unvollständiger Beleg (z.B. nur ein Foto von zwei Seiten): Summen betreffen nur die gelesenen Seiten
  const hinweise = []
  if (!laufend && hatRollung) hinweise.push('Nur die Aufrollungsseite wurde gelesen. Gehalt, Auszahlung und die Summen des laufenden Monats stehen auf der anderen Seite – am besten alle Seiten zusammen auswählen.')
  if (laufend && !hatRollung && summen.some((x) => x.key === 'differenz' && x.wert)) hinweise.push('Der Beleg enthält eine Differenz aus Vormonaten, die Aufrollungsseite wurde aber nicht gelesen – am besten alle Seiten zusammen auswählen.')
  if (hinweise.length) ['brutto', 'sv', 'lst', 'netto'].forEach((k) => { const f = felder[k]; if (f.wert != null) { f.eingeschraenkt = true; f.hinweis = (f.hinweis ? f.hinweis + ' · ' : '') + 'nur gelesene Seiten' } })
  return { felder: Object.values(felder), unzugeordnet, andereMonate, zeitraeume, hinweise, text: textZeilen.join('\n'), layout: L.name }
}

// Einstieg für die Oberfläche: bekanntes Layout verwenden, sonst allgemeine Zuordnung
export function werteAusDokument(woerter, soll, kontext, konf = KONFIGURATION, layouts = LAYOUTS) {
  const zeilen = gruppiereZeilen(woerter)
  const L = erkenneLayout(zeilen.map((z) => z.text).join('\n'), layouts)
  if (L) return werteAusBeleg(woerter, soll, kontext, L)
  return { ...werteAus(zeilen, soll, konf), andereMonate: [], layout: null }
}

// ── Vergleich ────────────────────────────────────────────────────────────────
// soll: {zeilen:[{la,bez,betrag}], brutto, sv, lst, netto}
// ist: {werte:{la|'brutto'|'sv'|'lst'|'netto': Zahl}, zusatz:[{name,betrag}]}
// toleranz: {position, summe}. Differenzen werden immer exakt ausgewiesen.
// ist.eingeschraenkt: Schlüssel, die laut Beleg nur eingeschränkt vergleichbar sind (z.B. Summen inkl. Aufrollung)
export function vergleiche(soll, ist, toleranz) {
  const w = ist.werte || {}, zeilen = [], eing = new Set(ist.eingeschraenkt || [])
  const zeile = (key, label, s, i, tol, art) => {
    const hatIst = typeof i === 'number' && Number.isFinite(i)
    const diff = hatIst ? r2(i - s) : null
    const status = !hatIst ? 'kein-ist' : Math.abs(diff) <= tol + 1e-9 ? 'ok' : eing.has(key) ? 'eingeschraenkt' : 'abweichung'
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
