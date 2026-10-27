// Zeiten aus einem Zeitnachweis in den Kalender einfügen – Auswahl, Kontrollfenster, Übernahme.
// Die App übergibt über `api` den geöffneten Monat, die Tagesarten und eine Übernahmefunktion.
// Datei und erkannte Werte bleiben nur im Speicher und werden beim Schließen verworfen.
import { erkenneDokument, pruefeAuswahl, Abbruch } from './ocr.mjs'
import { werteZeitnachweisAus } from './zeitnachweis.mjs'
import { KONFIGURATION } from './konfiguration.mjs'

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const zahl = (n) => (n ?? 0).toLocaleString(globalThis.PC_LOCALE || 'de-AT', { maximumFractionDigits: 2 })
const uhr = (h) => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0')
const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MONATE = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const OHNE_STUNDEN = ['frei', 'za', 'ruhe']

let offen = null

export function oeffne(api) {
  if (offen) return
  const bg = document.createElement('div'); bg.className = 'lz-bg'
  bg.innerHTML = '<div class="lz-dlg" role="dialog" aria-modal="true" aria-labelledby="lz-titel"></div>'
  document.body.appendChild(bg)
  offen = { api, bg, dlg: bg.firstElementChild, ctrl: null, erg: null, zuordnung: {}, vorschlag: {}, stunden: {}, merken: true }
  offen.tasten = (e) => { if (e.key === 'Escape') schliessen() }
  document.addEventListener('keydown', offen.tasten)
  zeigeStart()
}

export function schliessen() {
  if (!offen) return
  offen.ctrl?.abort()
  document.removeEventListener('keydown', offen.tasten)
  offen.bg.remove()
  offen = null
}

const kopf = (titel, unter = '') => `<div class="lz-kopf"><div><h2 id="lz-titel">${titel}</h2>${unter ? `<p class="hint" style="margin:2px 0 0;">${unter}</p>` : ''}</div><button class="icon-btn" data-lz="schliessen" aria-label="Schließen" title="Schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`
const DATENSCHUTZ = `<div class="lz-privacy"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/></svg><div><b>Dein Zeitnachweis verlässt dieses Gerät nicht.</b> Die Datei wird nur hier im Browser gelesen. Gespeichert werden nur die Tage, die du am Ende in den Kalender übernimmst.</div></div>`
const binde = () => offen.dlg.querySelectorAll('[data-lz="schliessen"]').forEach((b) => (b.onclick = schliessen))

function zeigeStart(fehler) {
  const m = offen.api.monat(), g = KONFIGURATION.grenzen
  offen.dlg.innerHTML = kopf('Zeiten importieren', `Zeitnachweis einlesen und die Tage in den Kalender ${esc(m.name)} einfügen.`) +
    DATENSCHUTZ +
    (fehler ? `<div class="callout" style="margin-top:12px;">${esc(fehler)}</div>` : '') +
    `<label class="lz-drop" tabindex="0">
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple hidden>
      <b>Zeitnachweis auswählen</b>
      <span>PDF aus der Zeiterfassung (bis ${g.maxSeiten} Seiten) oder Fotos – eines pro Seite</span>
    </label>
    <p class="hint">Gelesen werden je Tag Datum, Tagesprogramm (TP), Abwesenheit (ABW), Kommt/Geht und die Gesamtstunden. Danach legst du fest, welche Tagesart zu welchem Tagesprogramm gehört – Pay-Check merkt sich das für den nächsten Import.</p>
    <div class="lz-fuss"><button class="btn" data-lz="schliessen">Abbrechen</button></div>`
  binde()
  const inp = offen.dlg.querySelector('input[type=file]'), drop = offen.dlg.querySelector('.lz-drop')
  inp.onchange = () => { const f = [...inp.files]; inp.value = ''; if (f.length) verarbeite(f) }
  drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click() } }
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('ziel') }
  drop.ondragleave = () => drop.classList.remove('ziel')
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('ziel'); const f = [...e.dataTransfer.files]; if (f.length) verarbeite(f) }
}

async function verarbeite(dateien) {
  const p = pruefeAuswahl(dateien)
  if (p.fehler) return zeigeStart(p.fehler)
  const ctrl = new AbortController(); offen.ctrl = ctrl
  offen.dlg.innerHTML = kopf('Zeitnachweis wird gelesen', 'Alles passiert lokal in diesem Browser.') +
    `<div class="lz-progress"><div class="lz-bar"><div></div></div><p class="lz-schritt" role="status">Wird vorbereitet …</p></div>
    <div class="lz-fuss"><button class="btn" data-lz="abbruch">Abbrechen</button></div>`
  offen.dlg.querySelector('[data-lz="abbruch"]').onclick = () => { ctrl.abort(); zeigeStart('Verarbeitung abgebrochen. Es wurde nichts übernommen.') }
  binde()
  const balken = offen.dlg.querySelector('.lz-bar div'), text = offen.dlg.querySelector('.lz-schritt')
  try {
    const erg = await erkenneDokument(p.liste, { signal: ctrl.signal, fortschritt: (f) => {
      if (!offen || offen.ctrl !== ctrl) return
      text.textContent = f.schritt + (f.seiten > 1 ? ` (Seite ${f.seite} von ${f.seiten})` : '') + (f.anteil != null ? ` – ${Math.round(f.anteil * 100)} %` : ' …')
      balken.style.width = f.anteil != null ? Math.round(f.anteil * 100) + '%' : ''
      balken.parentElement.classList.toggle('unbestimmt', f.anteil == null)
    } })
    if (!offen || offen.ctrl !== ctrl) return
    offen.ctrl = null
    const aus = werteZeitnachweisAus(erg.woerter, { ersatzJahr: offen.api.monat().jahr })
    if (!aus.erkannt) return zeigeStart('In dieser Datei wurde kein Zeitnachweis erkannt (Spalten „Kommt“ und „Geht“ fehlen). Es wurde nichts übernommen.')
    if (!aus.tage.length) return zeigeStart('Im Zeitnachweis wurden keine Tage gefunden. Es wurde nichts übernommen.')
    offen.erg = { ...aus, quelle: erg.quelle, hinweise: [...erg.hinweise, ...aus.hinweise] }
    // gemerkte Zuordnung, sonst ein gekennzeichneter Vorschlag: M… = Montage, F… = frei (Feiertag)
    const gemerkt = offen.api.zuordnung()
    for (const c of codes()) {
      if (gemerkt[c]) offen.zuordnung[c] = gemerkt[c]
      else { const v = /^M/i.test(c) ? 'montage' : /^F/i.test(c) ? 'frei' : ''; offen.zuordnung[c] = v; if (v) offen.vorschlag[c] = true }
    }
    zeigeKontrolle()
  } catch (e) {
    if (!offen || offen.ctrl !== ctrl) return
    offen.ctrl = null
    if (e instanceof Abbruch) return
    zeigeStart('Die Datei konnte nicht verarbeitet werden: ' + (e?.message || e) + ' Es wurde nichts übernommen.')
  }
}

const codeVon = (t) => (t.abw || t.tp || '').trim() || '(ohne Code)'
function codes() { return [...new Set(offen.erg.tage.map(codeVon))] }
const imMonat = (t, m) => +t.key.slice(0, 4) === m.jahr && +t.key.slice(5, 7) === m.monat
const datumText = (key) => { const d = new Date(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)); return `${WT[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.` }

// Tage des geöffneten Monats mit Tagesart und Stunden (eigene Eingabe > Zeitnachweis > Standard der Tagesart)
function vorschau() {
  const m = offen.api.monat()
  return offen.erg.tage.filter((t) => imMonat(t, m)).map((t) => {
    const mode = offen.zuordnung[codeVon(t)] || ''
    let std = null
    if (mode && !OHNE_STUNDEN.includes(mode)) std = offen.stunden[t.key] ?? (t.stunden > 0 ? t.stunden : offen.api.standard(mode, t.key))
    return { t, mode, std }
  })
}

function zeigeKontrolle() {
  const { api, erg } = offen, m = api.monat(), modi = api.modi(), liste = vorschau()
  const andere = [...new Set(erg.tage.filter((t) => !imMonat(t, m)).map((t) => t.key.slice(0, 7)))]
  const uebernommen = liste.filter((x) => x.mode)
  const quelle = { text: 'Textebene des PDFs', ocr: 'Texterkennung (OCR) – bitte besonders genau prüfen', gemischt: 'Textebene und Texterkennung' }[erg.quelle]
  const zeitraum = erg.periode ? `${erg.periode.von.t}.${erg.periode.von.m}.${erg.periode.von.j} – ${erg.periode.bis.t}.${erg.periode.bis.m}.${erg.periode.bis.j}` : 'unbekannt'
  const optionen = (wahl) => `<option value="">nicht übernehmen</option>` + modi.map((o) => `<option value="${o.v}"${o.v === wahl ? ' selected' : ''}>${esc(o.l)}</option>`).join('')
  offen.dlg.innerHTML = kopf('Zeiten prüfen und einfügen', `Zeitnachweis ${esc(zeitraum)} · Quelle: ${esc(quelle)}`) +
    erg.hinweise.map((h) => `<div class="callout neutral" style="margin-bottom:10px;">${esc(h)}</div>`).join('') +
    (andere.length ? `<div class="callout" style="margin-bottom:10px;">${erg.tage.length - liste.length} Tage gehören nicht zu ${esc(m.name)} und werden hier nicht eingefügt. ${andere.map((k) => `<button class="link-btn" data-monat="${k}">${esc(MONATE[+k.slice(5) - 1] + ' ' + k.slice(0, 4))} öffnen</button>`).join(' · ')}</div>` : '') +
    `<p class="section-label" style="margin:6px 0 8px;">Tagesprogramme zuordnen</p>
    <div class="table-wrap"><table class="lz-tab zt-codes"><thead><tr><th>Code im Zeitnachweis</th><th class="r">Tage</th><th>Tagesart in Pay-Check</th></tr></thead><tbody>
    ${codes().map((c) => `<tr><td class="mono" translate="no">${esc(c)}</td><td class="r">${erg.tage.filter((t) => codeVon(t) === c).length}</td>
      <td><select data-code="${esc(c)}" aria-label="Tagesart für ${esc(c)}">${optionen(offen.zuordnung[c])}</select>${offen.vorschlag[c] ? '<span class="badge b-geaendert">Vorschlag – bitte prüfen</span>' : ''}</td></tr>`).join('')}
    </tbody></table></div>
    <label class="check" style="margin-top:8px;"><input type="checkbox" data-lz="merken"${offen.merken ? ' checked' : ''}> Zuordnung für den nächsten Import merken</label>
    <p class="section-label" style="margin:16px 0 8px;">Tage in ${esc(m.name)}</p>
    ${liste.length ? `<div class="table-wrap"><table class="lz-tab zt-tage"><thead><tr><th>Tag</th><th>Code</th><th>Laut Zeitnachweis</th><th>Tagesart</th><th class="r">Stunden</th></tr></thead><tbody>
    ${liste.map(({ t, mode, std }) => `<tr class="${mode ? '' : 'zt-aus'}"><td class="nowrap">${datumText(t.key)}</td><td class="mono" translate="no">${esc(codeVon(t))}</td>
      <td class="small">${[t.kommt.length ? t.kommt.map((k, i) => uhr(k) + '–' + (t.geht[i] != null ? uhr(t.geht[i]) : '?')).join(', ') : '', t.stunden > 0 ? zahl(t.stunden) + ' h' : '', t.soll != null ? 'Soll ' + zahl(t.soll) + ' h' : ''].filter(Boolean).join(' · ') || '—'}${t.unsicher.length ? `<div class="lz-hinweis">${esc(t.unsicher.join(' · '))}</div>` : ''}</td>
      <td>${mode ? esc(modi.find((o) => o.v === mode)?.l) : '<span class="muted">nicht übernehmen</span>'}</td>
      <td class="r">${std != null ? `<input type="text" inputmode="decimal" data-tag="${t.key}" value="${zahl(std)}" aria-label="Stunden am ${datumText(t.key)}">` : '—'}</td></tr>`).join('')}
    </tbody></table></div>` : `<p class="hint">Keine Tage in ${esc(m.name)}.</p>`}
    <p class="hint">Stunden kommen aus der Spalte „Gesamt“ bzw. Kommt/Geht; fehlen sie, gilt die Standardzeit der Tagesart aus den Einstellungen. Montage-Tage bekommen das eingestellte Einsatzland. Bestehende Einträge werden erst nach Rückfrage überschrieben.</p>
    <div class="lz-fuss"><button class="btn" data-lz="neu">Andere Datei</button><span class="spacer"></span>
      <button class="btn" data-lz="schliessen">Abbrechen</button>
      <button class="btn primary" data-lz="einfuegen"${uebernommen.length ? '' : ' disabled'}>${uebernommen.length} ${uebernommen.length === 1 ? 'Tag' : 'Tage'} einfügen</button></div>`
  binde()
  const dlg = offen.dlg
  dlg.querySelector('[data-lz="neu"]').onclick = () => { offen.erg = null; offen.zuordnung = {}; offen.vorschlag = {}; offen.stunden = {}; zeigeStart() }
  dlg.querySelector('[data-lz="merken"]').onchange = (e) => { offen.merken = e.target.checked }
  dlg.querySelectorAll('select[data-code]').forEach((s) => (s.onchange = () => { offen.zuordnung[s.dataset.code] = s.value; delete offen.vorschlag[s.dataset.code]; zeigeKontrolle() }))
  dlg.querySelectorAll('input[data-tag]').forEach((i) => (i.oninput = () => {
    const v = Number(i.value.replace(/\s/g, '').replace(',', '.'))
    const gueltig = i.value.trim() !== '' && Number.isFinite(v) && v >= 0 && v <= 24
    i.classList.toggle('lz-ungueltig', !gueltig)
    if (gueltig) offen.stunden[i.dataset.tag] = v
  }))
  dlg.querySelectorAll('[data-monat]').forEach((b) => (b.onclick = () => { const k = b.dataset.monat; api.wechsle(+k.slice(5), +k.slice(0, 4)); zeigeKontrolle() }))
  dlg.querySelector('[data-lz="einfuegen"]').onclick = () => {
    if (dlg.querySelector('input.lz-ungueltig')) { dlg.querySelector('input.lz-ungueltig').focus(); return }
    const tage = vorschau().filter((x) => x.mode).map((x) => ({ key: x.t.key, mode: x.mode, stunden: x.std ?? 0 }))
    if (offen.merken) {
      const merk = { ...api.zuordnung() }
      for (const c of codes()) { if (offen.zuordnung[c]) merk[c] = offen.zuordnung[c]; else delete merk[c] }
      api.merke(merk)
    }
    if (api.uebernehmen(tage) !== false) schliessen()
  }
}
