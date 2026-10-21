// Lokale Dokumentverarbeitung: PDF-Seiten mit PDF.js, Bilder mit Canvas, Texterkennung mit Tesseract.js.
// Alle Bibliotheken, Worker und Sprachdaten kommen aus ../vendor/ (gleiche Herkunft, feste Versionen).
// Es werden keine Dokumentinhalte übertragen und nichts dauerhaft gespeichert.
import { KONFIGURATION } from './konfiguration.mjs'
import './stream-polyfill.mjs'   // Safari: ReadableStream mit for await (PDF.js)

const VENDOR = new URL('../vendor/', import.meta.url)
const vendor = (p) => new URL(p, VENDOR).href

export class Abbruch extends Error { constructor() { super('Abgebrochen'); this.name = 'Abbruch' } }
const pruefeAbbruch = (signal) => { if (signal?.aborted) throw new Abbruch() }

// Auswahl prüfen: ein PDF oder bis zu maxSeiten Bilder (eines pro Seite), gemeinsam höchstens maxDateiMB
export function pruefeAuswahl(dateien, konf = KONFIGURATION) {
  const liste = Array.isArray(dateien) ? dateien : [...(dateien?.length != null ? dateien : [dateien])].filter(Boolean)
  if (!liste.length) return { fehler: 'Keine Datei ausgewählt.' }
  const typen = liste.map((d) => pruefeDatei(d, konf))
  const f = typen.find((t) => t.fehler); if (f) return f
  if (liste.length > 1 && typen.some((t) => t.typ === 'pdf')) return { fehler: 'Bitte entweder ein PDF oder mehrere Fotos auswählen, nicht beides.' }
  if (liste.length > konf.grenzen.maxSeiten) return { fehler: `Höchstens ${konf.grenzen.maxSeiten} Fotos auf einmal.` }
  if (liste.reduce((s, d) => s + d.size, 0) > konf.grenzen.maxDateiMB * 1024 * 1024) return { fehler: `Die Dateien sind zusammen größer als ${konf.grenzen.maxDateiMB} MB.` }
  return { typ: typen[0].typ, liste }
}

// Dateityp und -größe einer Datei prüfen, bevor irgendetwas geladen wird
export function pruefeDatei(datei, konf = KONFIGURATION) {
  const name = (datei.name || '').toLowerCase()
  const typ = datei.type === 'application/pdf' || name.endsWith('.pdf') ? 'pdf'
    : /^image\/(jpeg|png)$/.test(datei.type) || /\.(jpe?g|png)$/.test(name) ? 'bild' : null
  if (!typ) return { fehler: 'Nur PDF, JPG oder PNG werden unterstützt.' }
  if (datei.size > konf.grenzen.maxDateiMB * 1024 * 1024) return { fehler: `Die Datei ist größer als ${konf.grenzen.maxDateiMB} MB.` }
  if (!datei.size) return { fehler: 'Die Datei ist leer.' }
  return { typ }
}

// Graustufen und Kontrastspreizung (1.–99. Perzentil) – hilft bei blassen Scans und Fotos
export function bereiteAuf(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height), d = img.data
  const hist = new Uint32Array(256), n = d.length / 4
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]); d[i] = g; hist[g]++
  }
  let lo = 0, hi = 255, s = 0
  while (lo < 255 && (s += hist[lo]) < n * 0.01) lo++
  s = 0; while (hi > 0 && (s += hist[hi]) < n * 0.01) hi--
  const spanne = Math.max(1, hi - lo)
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.max(0, Math.min(255, Math.round((d[i] - lo) * 255 / spanne)))
    d[i] = d[i + 1] = d[i + 2] = g; d[i + 3] = 255
  }
  entferneLinien(d, canvas.width, canvas.height)
  ctx.putImageData(img, 0, 0)
  return canvas
}

// Schräglage schätzen (Zeilenprofil): Winkel, bei dem die dunklen Pixel die schärfsten waagrechten Zeilen bilden.
// punkte: [x0, y0, x1, y1, …] dunkler Pixel (verkleinertes Bild). Ergebnis in Grad, positiv = im Uhrzeigersinn gedreht.
export function schaetzeSchraeglage(punkte, { max = 6, schritt = 0.2 } = {}) {
  let best = { grad: 0, wert: -1 }
  for (let g = -max; g <= max + 1e-9; g += schritt) {
    const a = (g * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a), bins = new Map()
    for (let i = 0; i < punkte.length; i += 2) { const y = Math.round(punkte[i + 1] * c - punkte[i] * s); bins.set(y, (bins.get(y) || 0) + 1) }
    let wert = 0; for (const v of bins.values()) wert += v * v
    if (wert > best.wert) best = { grad: Math.round(g * 100) / 100, wert }
  }
  return best.grad
}

// Leinwand um die geschätzte Schräglage zurückdrehen (nur ab 0,3°, sonst unverändert)
function begradige(canvas) {
  const f = Math.min(1, 800 / canvas.width), k = leinwand(canvas.width * f, canvas.height * f), kc = k.getContext('2d', { willReadFrequently: true })
  kc.drawImage(canvas, 0, 0, k.width, k.height)
  const d = kc.getImageData(0, 0, k.width, k.height).data
  let summe = 0; for (let i = 0; i < d.length; i += 4) summe += d[i] + d[i + 1] + d[i + 2]
  const grenze = (summe / (d.length / 4) / 3) * 0.6, punkte = []
  for (let y = 0; y < k.height; y++) for (let x = 0; x < k.width; x++) { const i = (y * k.width + x) * 4; if (d[i] + d[i + 1] + d[i + 2] < grenze * 3) punkte.push(x, y) }
  k.width = k.height = 0
  const grad = punkte.length > 200 ? schaetzeSchraeglage(punkte) : 0
  if (Math.abs(grad) < 0.3) return { canvas, grad: 0 }
  const r = leinwand(canvas.width, canvas.height), rc = r.getContext('2d')
  rc.fillStyle = '#fff'; rc.fillRect(0, 0, r.width, r.height)
  rc.translate(r.width / 2, r.height / 2); rc.rotate((-grad * Math.PI) / 180); rc.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
  canvas.width = canvas.height = 0
  return { canvas: r, grad }
}

// Tabellenlinien entfernen: Läufe dunkler Pixel, die deutlich länger sind als Schrift hoch ist.
// Beschriftungen direkt an Zellrändern gehen sonst bei der Texterkennung verloren.
export function entferneLinien(d, w, h, schwelle = 140) {
  const textH = Math.max(12, Math.round(w / 70))   // grobe Schrifthöhe: ~1/70 der Seitenbreite
  const dunkel = (i) => d[i * 4] < schwelle, weg = new Uint8Array(w * h)
  const lauf = (n, schritt, start, minLen) => {
    let anf = -1
    for (let k = 0; k <= n; k++) {
      const i = start + k * schritt, an = k < n && dunkel(i)
      if (an && anf < 0) anf = k
      if (!an && anf >= 0) { if (k - anf >= minLen) for (let j = anf; j < k; j++) weg[start + j * schritt] = 1; anf = -1 }
    }
  }
  for (let y = 0; y < h; y++) lauf(w, 1, y * w, textH * 3)
  for (let x = 0; x < w; x++) lauf(h, w, x, textH * 2)
  for (let i = 0; i < w * h; i++) if (weg[i]) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255 }
}

function leinwand(w, h) { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c }

// Bild (JPG/PNG) auf eine für die Texterkennung sinnvolle Größe bringen
async function bildZuLeinwand(datei, konf) {
  const bmp = await createImageBitmap(datei, { imageOrientation: 'from-image' })
  try {
    const { maxPixel, minBreite } = konf.grenzen
    let f = Math.min(1, maxPixel / Math.max(bmp.width, bmp.height))
    if (bmp.width * f < minBreite) f = Math.min(minBreite / bmp.width, maxPixel / Math.max(bmp.width, bmp.height))
    const c = leinwand(bmp.width * f, bmp.height * f)
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(bmp, 0, 0, c.width, c.height)
    return c
  } finally { bmp.close() }
}

let pdfjsPromise = null
const ladePdfjs = () => (pdfjsPromise ||= import(vendor('pdfjs/pdf.min.mjs')).then((m) => {
  // Worker über ein eigenes Startmodul, damit die Stream-Ergänzung auch im Worker gilt
  m.GlobalWorkerOptions.workerSrc = new URL('./pdf-worker.mjs', import.meta.url).href; return m
}))
let tesseractPromise = null
const ladeTesseract = () => (tesseractPromise ||= new Promise((ok, fehler) => {
  if (window.Tesseract) return ok(window.Tesseract)
  const s = document.createElement('script'); s.src = vendor('tesseract/tesseract.min.js')
  s.onload = () => ok(window.Tesseract); s.onerror = () => { tesseractPromise = null; fehler(new Error('Texterkennung konnte nicht geladen werden.')) }
  document.head.appendChild(s)
}))

// Wörter aus der Textebene eines digitalen PDFs (genauer als Texterkennung)
function woerterAusText(inhalt, viewport, seite) {
  const out = []
  for (const it of inhalt.items) {
    if (!it.str || !it.str.trim()) continue
    const [, , c, d, e, f] = it.transform
    const h = Math.hypot(c, d) || it.height || 10, y1 = viewport.height - f, y0 = y1 - h
    // Textelemente sind bereits zusammengehörige Zellen – nur an mehrfachen Leerzeichen trennen
    const teile = it.str.split(/(\s{2,})/), proZeichen = (it.width || it.str.length * h * 0.5) / it.str.length
    let x = e
    for (const t of teile) {
      if (t.trim()) out.push({ text: t, conf: 100, seite, bbox: { x0: x, y0, x1: x + t.length * proZeichen, y1 } })
      x += t.length * proZeichen
    }
  }
  return out
}

// Hauptfunktion: Datei(en) → Wörter mit Position und Konfidenz. Gibt alle Ressourcen wieder frei.
// dateien: ein PDF oder mehrere Bilder (je eine Seite). fortschritt({schritt, seite, seiten, anteil})
export async function erkenneDokument(dateien, { konf = KONFIGURATION, fortschritt = () => {}, signal } = {}) {
  const pruefung = pruefeAuswahl(dateien, konf)
  if (pruefung.fehler) throw new Error(pruefung.fehler)
  const datei = pruefung.liste[0]
  const leinwaende = [], woerter = [], hinweise = []
  let pdf = null, ladeAufgabe = null, worker = null, quelle = 'ocr'
  const beenden = () => Promise.resolve(worker?.terminate()).catch(() => {})
  signal?.addEventListener('abort', beenden, { once: true })
  try {
    if (pruefung.typ === 'pdf') {
      fortschritt({ schritt: 'PDF wird gelesen' })
      const pdfjs = await ladePdfjs(); pruefeAbbruch(signal)
      const daten = new Uint8Array(await datei.arrayBuffer())
      ladeAufgabe = pdfjs.getDocument({ data: daten, isEvalSupported: false, enableXfa: false,
        wasmUrl: vendor('pdfjs/wasm/'), standardFontDataUrl: vendor('pdfjs/standard_fonts/'), iccUrl: vendor('pdfjs/iccs/') })
      pdf = await ladeAufgabe.promise
      const seiten = Math.min(pdf.numPages, konf.grenzen.maxSeiten)
      if (pdf.numPages > seiten) hinweise.push(`Das PDF hat ${pdf.numPages} Seiten – ausgewertet werden nur die ersten ${seiten}.`)
      let mitText = 0
      for (let i = 1; i <= seiten; i++) {
        pruefeAbbruch(signal)
        fortschritt({ schritt: 'PDF-Seite wird gelesen', seite: i, seiten })
        const page = await pdf.getPage(i)
        const vp1 = page.getViewport({ scale: 1 })
        const inhalt = await page.getTextContent()
        const zeichen = inhalt.items.reduce((s, it) => s + (it.str || '').trim().length, 0)
        if (zeichen >= 40) { woerter.push(...woerterAusText(inhalt, vp1, i)); mitText++; page.cleanup(); continue }
        // Gescannte Seite: rendern und später per Texterkennung lesen
        const f = Math.min(konf.grenzen.pdfScale, konf.grenzen.maxPixel / Math.max(vp1.width, vp1.height))
        const vp = page.getViewport({ scale: f }), c = leinwand(vp.width, vp.height)
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp, canvas: c }).promise
        page.cleanup()
        leinwaende.push({ c, seite: i })
      }
      quelle = mitText && !leinwaende.length ? 'text' : mitText ? 'gemischt' : 'ocr'
    } else {
      for (const [i, bild] of pruefung.liste.entries()) {
        pruefeAbbruch(signal)
        fortschritt({ schritt: 'Bild wird vorbereitet', seite: i + 1, seiten: pruefung.liste.length })
        leinwaende.push({ c: await bildZuLeinwand(bild, konf), seite: i + 1 })
      }
    }

    if (leinwaende.length) {
      pruefeAbbruch(signal)
      fortschritt({ schritt: 'Texterkennung wird geladen' })
      const T = await ladeTesseract(); pruefeAbbruch(signal)
      worker = await T.createWorker(konf.ocr.sprache, T.OEM.LSTM_ONLY, {
        workerPath: vendor('tesseract/worker.min.js'), corePath: vendor('tesseract/core/'), langPath: vendor('tesseract/lang'),
        gzip: true, cacheMethod: 'none', workerBlobURL: false,
        logger: (m) => { if (m.status === 'recognizing text') fortschritt({ schritt: 'Texterkennung', anteil: m.progress, seite: m.seite }) },
      })
      await worker.setParameters({ tessedit_pageseg_mode: konf.ocr.psm, preserve_interword_spaces: '1' })
      for (const [k, eintrag] of leinwaende.entries()) {
        pruefeAbbruch(signal)
        fortschritt({ schritt: 'Texterkennung', seite: k + 1, seiten: leinwaende.length, anteil: 0 })
        // erst begradigen, dann Linien entfernen – schräge Tabellenlinien wären sonst keine langen Läufe
        const { canvas: c, grad } = begradige(eintrag.c); eintrag.c = c
        if (grad) hinweise.push(`Seite ${eintrag.seite}: Schräglage von ${String(Math.abs(grad)).replace('.', ',')}° ausgeglichen.`)
        const seite = eintrag.seite
        bereiteAuf(c)
        // rotateAuto: leichte Schräglage (Fotos, schief eingelegte Scans) vor der Erkennung ausgleichen
        const { data } = await worker.recognize(c, { rotateAuto: true }, { blocks: true })
        for (const b of data.blocks || []) for (const p of b.paragraphs) for (const l of p.lines) for (const w of l.words) {
          woerter.push({ text: w.text, conf: w.confidence, seite, bbox: w.bbox })
        }
      }
    }
    pruefeAbbruch(signal)
    return { woerter, quelle, hinweise }
  } finally {
    // Ressourcen sofort freigeben – auch bei Fehler oder Abbruch. Fehler beim Aufräumen überdecken nie das Ergebnis.
    signal?.removeEventListener('abort', beenden)
    try { await beenden() } catch (e) { /* Worker bereits beendet */ }
    worker = null
    leinwaende.forEach(({ c }) => { c.width = 0; c.height = 0 })
    leinwaende.length = 0
    try { await ladeAufgabe?.destroy() } catch (e) { /* bereits freigegeben */ }
    pdf = ladeAufgabe = null
  }
}
