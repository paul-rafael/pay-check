// Zeitnachweis (Zeiterfassung des Arbeitgebers) auswerten: je Tag Datum, Tagesprogramm, Kommt/Geht und Stunden.
// Spalten werden über die Überschriften im Dokument bestimmt, nicht über feste Koordinaten.
// Stunden stehen als Stunden,Minuten – „8,15“ = 8 h 15 min = 8,25 h. Es wird nichts geraten:
// unlesbare Werte bleiben leer und sind als unsicher markiert.
import { gruppiereZeilen } from './parser.mjs'
import { KONFIGURATION } from './konfiguration.mjs'

export const SPALTEN = { kommt: /^Kommt$/i, geht: /^Geht$/i, tp: /^TP$/i, gesamt: /^Gesamt$/i, soll: /^Soll$/i, saldo: /^\+\/-$/,
  u50: /^U50$/i, u100: /^U100$/i, vf: /^VF$/i, nlz: /^NLZ$/i, abw: /^ABW$/i }
const STUNDEN = ['gesamt', 'soll', 'saldo', 'u50', 'u100', 'vf', 'nlz']
const WT = /^(Mo|Di|Mi|Do|Fr|Sa|So)\s*(\d{1,2}\.\d{1,2})?\.?$/   // „Mo05.10“, „Di 06.10“ (ein Wort) oder „Di“ + „06.10“
const DATUM = /^(\d{1,2})\.(\d{1,2})\.?$/
const ENDE = /^(Wochensumme|Umbuchungen|Periodensumme|Gesamtsumme|Salden)\b/i

export function istZeitnachweis(text) { return /Zeitnachweis/i.test(text) && /\bKommt\b/i.test(text) && /\bGeht\b/i.test(text) }

// „8,15“ → 8,25 h; „-8,15“ → −8,25 h. Minuten ab 60 sind kein gültiger Wert.
export function parseStdMin(t) {
  const m = /^([-−]?)(\d{1,4}),(\d{2})-?$/.exec(String(t ?? '').trim())
  if (!m || +m[3] >= 60) return null
  const v = +m[2] + +m[3] / 60
  return Math.round((m[1] || String(t).trim().endsWith('-') ? -v : v) * 100) / 100
}
// „07:30“ oder „7.30“ → 7,5 h
export function parseUhrzeit(t) {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(String(t ?? '').trim())
  if (!m || +m[1] > 24 || +m[2] >= 60) return null
  return +m[1] + +m[2] / 60
}

// Spalte eines Worts: größte waagrechte Überlappung mit einer Überschrift, sonst die nächste in Reichweite
function spalteFuer(w, kopf, reichweite) {
  let best = null
  for (const [k, b] of Object.entries(kopf)) {
    const ueber = Math.min(w.bbox.x1, b.x1) - Math.max(w.bbox.x0, b.x0)
    const abstand = ueber > 0 ? -ueber : Math.max(b.x0 - w.bbox.x1, w.bbox.x0 - b.x1)
    if (abstand <= reichweite && (!best || abstand < best.abstand)) best = { k, abstand }
  }
  return best?.k ?? null
}

function jahrFuer(tag, monat, periode, ersatzJahr) {
  if (!periode) return ersatzJahr
  for (let j = periode.von.j; j <= periode.bis.j; j++) {
    const d = j * 10000 + monat * 100 + tag
    if (d >= periode.von.j * 10000 + periode.von.m * 100 + periode.von.t && d <= periode.bis.j * 10000 + periode.bis.m * 100 + periode.bis.t) return j
  }
  return periode.von.j
}
const key = (j, m, t) => `${j}-${String(m).padStart(2, '0')}-${String(t).padStart(2, '0')}`

// woerter: [{text, conf, seite, bbox:{x0,y0,x1,y1}}] → { erkannt, periode, tage, hinweise }
export function werteZeitnachweisAus(woerter, { ersatzJahr = new Date().getFullYear(), konf = KONFIGURATION } = {}) {
  const zeilen = gruppiereZeilen(woerter), text = zeilen.map((z) => z.text).join('\n')
  const hinweise = []
  if (!istZeitnachweis(text)) return { erkannt: false, periode: null, tage: [], hinweise }
  const p = /Periode:?\s*(\d{1,2})[-.](\d{1,2})[-.](\d{4})\s*-\s*(\d{1,2})[-.](\d{1,2})[-.](\d{4})/i.exec(text)
  const periode = p ? { von: { t: +p[1], m: +p[2], j: +p[3] }, bis: { t: +p[4], m: +p[5], j: +p[6] } } : null
  if (!periode) hinweise.push(`Zeitraum nicht gefunden – Datum ohne Jahr wird ${ersatzJahr} zugeordnet.`)

  const tage = []
  let kopf = null, kopfSeite = null, tag = null
  for (const z of zeilen) {
    // Überschrift: Spaltenpositionen je Seite neu bestimmen
    if (z.woerter.some((w) => SPALTEN.kommt.test(w.text)) && z.woerter.some((w) => SPALTEN.geht.test(w.text))) {
      kopf = {}
      // unbekannte Überschriften (z.B. „§68/2Komm.“) bleiben als Spalte erhalten, damit ihre Werte nirgends falsch landen
      z.woerter.forEach((w, n) => {
        const k = Object.keys(SPALTEN).find((x) => SPALTEN[x].test(w.text)) ?? '_' + n
        kopf[k] = { x0: w.bbox.x0, x1: w.bbox.x1 }
      })
      kopfSeite = z.seite; tag = null; continue
    }
    if (!kopf || z.seite !== kopfSeite) continue
    if (ENDE.test(z.text)) { tag = null; continue }
    const w = z.woerter, reichweite = z.h * 2.5
    let i = 0, datum = null
    const a = WT.exec(w[0]?.text || '')
    if (a && a[2]) { datum = DATUM.exec(a[2]); i = 1 }
    else if (a && DATUM.test(w[1]?.text || '')) { datum = DATUM.exec(w[1].text); i = 2 }
    if (datum) {
      const t = +datum[1], m = +datum[2], j = jahrFuer(t, m, periode, ersatzJahr)
      tag = { key: key(j, m, t), wt: a[1], tp: '', abw: '', kommt: [], geht: [], unsicher: [], zeile: z.text }
      tage.push(tag)
    } else if (!tag) continue
    // Werte den Spalten zuordnen; Zeilen ohne Datum direkt nach einem Tag sind weitere Kommt/Geht-Paare
    for (const x of w.slice(i)) {
      const k = spalteFuer(x, kopf, reichweite)
      if (!k || k.startsWith('_')) continue
      const unsicher = (x.conf ?? 100) < konf.minKonfidenz
      if (k === 'tp' || k === 'abw') { if (!datum && tag[k]) continue; tag[k] = (tag[k] ? tag[k] + ' ' : '') + x.text }
      else if (k === 'kommt' || k === 'geht') {
        const v = parseUhrzeit(x.text)
        if (v == null) tag.unsicher.push(`${k === 'kommt' ? 'Kommt' : 'Geht'} „${x.text}“ nicht lesbar`)
        else tag[k].push(v)
      } else if (STUNDEN.includes(k)) {
        const v = parseStdMin(x.text)
        if (v == null) { tag.unsicher.push(`${k} „${x.text}“ nicht lesbar`); continue }
        tag[k] = datum || tag[k] == null ? v : Math.round((tag[k] + v) * 100) / 100
      }
      if (unsicher) tag.unsicher.push(`„${x.text}“ unsicher erkannt`)
    }
  }
  // Arbeitsstunden: Spalte Gesamt, sonst Summe der Kommt/Geht-Paare
  for (const t of tage) {
    let std = t.gesamt ?? null
    if (std == null && t.kommt.length && t.kommt.length === t.geht.length) {
      std = Math.round(t.kommt.reduce((s, k, i) => s + ((t.geht[i] - k + 24) % 24), 0) * 100) / 100
    }
    t.stunden = std
  }
  if (tage.length) hinweise.push('Stunden im Format Stunden,Minuten gelesen („8,15“ = 8 h 15 min).')
  return { erkannt: true, periode, tage, hinweise }
}
