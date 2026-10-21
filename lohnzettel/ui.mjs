// Oberfläche für den lokalen Lohnzettel-Abgleich: Datei wählen → lokal erkennen → Werte kontrollieren → vergleichen.
// Die App übergibt über `api` nur die berechneten Soll-Werte und eine Übernahmefunktion.
// Hochgeladene Dateien und erkannte Werte werden nicht gespeichert, außer der Nutzer übernimmt sie ausdrücklich.
import { KONFIGURATION } from './konfiguration.mjs'
import { werteAusDokument, vergleiche, parseBetrag } from './parser.mjs'
import { erkenneDokument, pruefeAuswahl, Abbruch } from './ocr.mjs'

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fmt = (n) => (n ?? 0).toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtE = (n) => (n == null ? '—' : fmt(n) + ' €')
const fmtD = (n) => (n == null ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '±') + fmt(Math.abs(n)) + ' €')
// Eingabe im Kontrollfenster: österreichisches Format, zusätzlich ganze Zahlen und Kommazahlen ohne Tausenderpunkt
export function parseEingabe(s) {
  const t = String(s ?? '').trim()
  if (!t) return { leer: true }
  const b = parseBetrag(t) ?? (/^[-−]?\d+(,\d{1,2})?$/.test(t) ? Math.round(Number(t.replace('−', '-').replace(',', '.')) * 100) / 100 : null)
  return b == null ? { fehler: true } : { wert: b }
}
const STATUS = { erkannt: ['b-ok', 'erkannt'], unsicher: ['b-geaendert', 'unsicher'], mehrdeutig: ['b-veraltet', 'mehrdeutig'], fehlt: ['b-fehlt', 'nicht gefunden'], bearbeitet: ['b-gespeichert', 'von dir geändert'], fehler: ['b-veraltet', 'ungültige Eingabe'] }

let offen = null   // nur eine Sitzung gleichzeitig; enthält ausschließlich flüchtige Daten

export function oeffne(api) {
  if (offen) return
  const bg = document.createElement('div'); bg.className = 'lz-bg'
  bg.innerHTML = '<div class="lz-dlg" role="dialog" aria-modal="true" aria-labelledby="lz-titel"></div>'
  document.body.appendChild(bg)
  const dlg = bg.firstElementChild
  offen = { api, bg, dlg, ctrl: null, ergebnis: null, felder: null, zusatz: null }
  const tasten = (e) => { if (e.key === 'Escape') schliessen() }
  document.addEventListener('keydown', tasten)
  offen.tasten = tasten
  zeigeStart()
}

// Alles verwerfen und freigeben: laufende Verarbeitung abbrechen, Daten und DOM entfernen
export function schliessen() {
  if (!offen) return
  offen.ctrl?.abort()
  document.removeEventListener('keydown', offen.tasten)
  offen.bg.remove()
  offen.ergebnis = offen.felder = offen.zusatz = null
  offen = null
}

const kopf = (titel, unter = '') => `<div class="lz-kopf"><div><h2 id="lz-titel">${titel}</h2>${unter ? `<p class="hint" style="margin:2px 0 0;">${unter}</p>` : ''}</div><button class="icon-btn" data-lz="schliessen" aria-label="Schließen" title="Schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`
const DATENSCHUTZ = `<div class="lz-privacy"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/></svg><div><b>Dein Lohnzettel verlässt dieses Gerät nicht.</b> Die Datei wird nur hier im Browser gelesen und erkannt – ohne Server, ohne Upload, ohne externe Dienste. Datei und erkannte Werte werden nicht gespeichert und nach dem Schließen verworfen. Gespeichert wird nur, was du am Ende ausdrücklich in den Soll-Ist-Vergleich übernimmst.</div></div>`

function binde() {
  offen.dlg.querySelectorAll('[data-lz="schliessen"]').forEach((b) => (b.onclick = schliessen))
}

function zeigeStart(fehler) {
  const { api } = offen, s = api.soll(), g = KONFIGURATION.grenzen
  offen.dlg.innerHTML = kopf('Lohnzettel einlesen', `Berechnet für ${esc(s.arbeitsMonat.name)} – passend ist meist der Lohnzettel ${esc(s.lohnzettelMonat.name)}.`) +
    DATENSCHUTZ +
    (s.leer ? `<div class="callout" style="margin-top:12px;">Für ${esc(s.arbeitsMonat.name)} ist noch nichts erfasst. Ohne erfasste Tage gibt es nichts zu vergleichen – trage zuerst den Monat im Kalender ein.</div>` : '') +
    (fehler ? `<div class="callout" style="margin-top:12px;">${esc(fehler)}</div>` : '') +
    `<label class="lz-drop" tabindex="0">
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple hidden>
      <b>PDF oder Fotos auswählen</b>
      <span>ein PDF (bis ${g.maxSeiten} Seiten) oder bis zu ${g.maxSeiten} Fotos – eines pro Seite · JPG oder PNG · zusammen bis ${g.maxDateiMB} MB</span>
    </label>
    <p class="hint">Tipp: Digitale PDFs aus der Lohnverrechnung werden direkt gelesen und sind am genauesten. Fotos möglichst gerade, scharf und gut ausgeleuchtet aufnehmen.</p>
    <p class="hint"><b>Vorschau-Funktion:</b> Abgestimmt auf den Abrechnungsbeleg mit den Spalten Lohnart · Einheiten · Satz/BMG · Abzüge · Bezüge. Andere Lohnzettel werden nur allgemein zugeordnet. Bitte jeden erkannten Wert kontrollieren.</p>
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
  offen.dlg.innerHTML = kopf('Lohnzettel wird gelesen', 'Alles passiert lokal in diesem Browser.') +
    `<div class="lz-progress"><div class="lz-bar"><div></div></div><p class="lz-schritt" role="status">Wird vorbereitet …</p></div>
    <div class="lz-fuss"><button class="btn" data-lz="abbruch">Abbrechen</button></div>`
  offen.dlg.querySelector('[data-lz="abbruch"]').onclick = () => { ctrl.abort(); zeigeStart('Verarbeitung abgebrochen. Es wurde nichts gespeichert.') }
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
    const s = offen.api.soll()
    const aus = werteAusDokument(erg.woerter, s.zeilen, { arbeitsMonat: s.arbeitsMonat })
    offen.ergebnis = { ...aus, quelle: erg.quelle, hinweise: [...erg.hinweise, ...(aus.hinweise || [])], woerter: erg.woerter.length }
    offen.felder = aus.felder.map((f) => ({ ...f, erkanntStatus: f.status, eingabe: f.wert != null ? fmt(f.wert) : '' }))
    offen.zusatz = aus.unzugeordnet.map((u) => ({ ...u, wahl: '' }))
    zeigeKontrolle()
  } catch (e) {
    if (!offen || offen.ctrl !== ctrl) return
    offen.ctrl = null
    if (e instanceof Abbruch) return
    zeigeStart('Die Datei konnte nicht verarbeitet werden: ' + (e?.message || e) + ' Es wurde nichts gespeichert.')
  }
}

function zeitraumHinweis(zeitraeume, s) {
  if (!zeitraeume.length) return { typ: 'neutral', text: `Abrechnungsmonat nicht erkannt. Bitte prüfen, ob es der Lohnzettel ${s.lohnzettelMonat.name} ist.` }
  const keys = zeitraeume.map((z) => z.key), namen = zeitraeume.map((z) => z.name || z.key).join(', ')
  if (keys.length === 1 && keys[0] === s.lohnzettelMonat.key) return { typ: 'ok', text: `Lohnzettel ${s.lohnzettelMonat.name} erkannt – passt zur Berechnung für ${s.arbeitsMonat.name}.` }
  if (keys.length === 1 && keys[0] === s.arbeitsMonat.key) return { typ: 'warn', text: `Erkannt wurde der Lohnzettel ${s.arbeitsMonat.name}. Zuschläge und Taggeld darin stammen meist aus dem Vormonat – der Vergleich mit der Berechnung für ${s.arbeitsMonat.name} ist dann nur eingeschränkt aussagekräftig.` }
  if (keys.length > 1) return { typ: 'warn', text: `Mehrere Zeiträume gefunden (${namen}). Bitte prüfen, ob es der Lohnzettel ${s.lohnzettelMonat.name} ist.` }
  return { typ: 'warn', text: `Erkannt wurde ${namen} – abweichender Bezugszeitraum. Erwartet: Lohnzettel ${s.lohnzettelMonat.name}. Die Werte sind nicht direkt vergleichbar.` }
}

function zeigeKontrolle() {
  const { ergebnis: e, felder, zusatz, api } = offen, s = api.soll()
  e.zeitraeume.forEach((z) => (z.name = s.monatName(z.key)))
  const zr = zeitraumHinweis(e.zeitraeume, s)
  const quelle = { text: 'Textebene des PDFs (digital, ohne Texterkennung)', ocr: 'Texterkennung (OCR)', gemischt: 'Textebene und Texterkennung' }[e.quelle] +
    (e.layout ? ' · Layout: ' + e.layout : ' · Layout nicht erkannt, allgemeine Zuordnung')
  const zeile = (f, i) => {
    const st = f.status, [cls, lbl] = STATUS[st]
    const wahl = st === 'mehrdeutig' || (f.kandidaten.length > 1 && st !== 'fehlt')
      ? `<select data-k="${i}" class="input-sm" aria-label="Betrag wählen"><option value="">– Betrag wählen –</option>${f.kandidaten.map((k, j) => `<option value="${j}">${fmtE(k.wert)} · ${esc(k.text.slice(0, 48))}</option>`).join('')}</select>` : ''
    return `<tr class="lz-st-${st}"><td><b>${esc(f.label)}</b>${f.art === 'lohnart' ? ` <span class="mono">${esc(f.key)}</span>` : ''}
        ${f.quelle.length ? `<div class="lz-quelle">${esc(f.quelle[0])}${f.quelle.length > 1 ? ` <i>(+${f.quelle.length - 1})</i>` : ''}</div>` : ''}
        ${f.hinweis ? `<div class="lz-hinweis">${esc(f.hinweis)}</div>` : ''}</td>
      <td>${wahl}<input type="text" inputmode="decimal" data-i="${i}" value="${esc(f.eingabe)}" placeholder="leer" aria-label="Ist-Betrag ${esc(f.label)}"></td>
      <td><span class="badge ${cls}" data-b="${i}">${lbl}</span></td></tr>`
  }
  const lohnarten = felder.map((f, i) => [f, i]).filter(([f]) => f.art === 'lohnart'), summen = felder.map((f, i) => [f, i]).filter(([f]) => f.art === 'summe')
  const offenAnz = felder.filter((f) => f.erkanntStatus === 'mehrdeutig' || f.erkanntStatus === 'unsicher').length
  offen.dlg.innerHTML = kopf('Erkannte Werte prüfen', `Quelle: ${quelle}. Werte bei Bedarf korrigieren – leere Felder werden nicht verglichen.`) +
    `<div class="callout ${zr.typ === 'ok' ? 'neutral' : ''}" style="margin-bottom:10px;">${esc(zr.text)}</div>` +
    e.hinweise.map((h) => `<div class="callout neutral" style="margin-bottom:10px;">${esc(h)}</div>`).join('') +
    (offenAnz ? `<p class="hint" style="margin:0 0 8px;"><b class="warn-count">${offenAnz} ${offenAnz === 1 ? 'Wert braucht' : 'Werte brauchen'} deine Prüfung</b> (unsicher oder mehrdeutig). Es wird kein Betrag geraten.</p>` : '') +
    `<div class="table-wrap"><table class="lz-tab"><thead><tr><th>Position laut Berechnung</th><th>Ist laut Lohnzettel</th><th>Status</th></tr></thead><tbody>
      ${lohnarten.map(([f, i]) => zeile(f, i)).join('')}
      <tr class="lz-trenner"><td colspan="3">Summen</td></tr>
      ${summen.map(([f, i]) => zeile(f, i)).join('')}
    </tbody></table></div>` +
    (zusatz.length ? `<details class="fold" ${zusatz.some((z) => z.code) ? 'open' : ''} style="margin-top:8px;"><summary>Weitere Zeilen mit Beträgen <span class="sum-meta">${zusatz.length} nicht zugeordnet</span></summary><div class="fold-body">
      <p class="hint" style="margin:0 0 8px;">Diese Zeilen ließen sich keiner berechneten Position eindeutig zuordnen. Nur übernehmen, wenn es tatsächlich Bezüge dieses Monats sind – sie werden dann als „nur am Lohnzettel“ angezeigt und nicht mit der Berechnung verrechnet.</p>
      ${zusatz.map((z, i) => `<div class="lz-zusatz"><div><div class="lz-quelle">${esc(z.text)}</div><div class="lz-hinweis">${esc(z.grund)}</div></div>
        <select data-z="${i}" class="input-sm" aria-label="Zeile übernehmen"><option value="">ignorieren</option>${z.betraege.map((b, j) => `<option value="${j}">als weitere Position: ${fmtE(b)}</option>`).join('')}</select></div>`).join('')}
      </div></details>` : '') +
    (e.andereMonate.length ? `<details class="fold" style="margin-top:8px;"><summary>Andere Bezugsmonate <span class="sum-meta">${e.andereMonate.length} nicht verglichen</span></summary><div class="fold-body">
      <p class="hint" style="margin:0 0 8px;">Diese Zeilen betreffen einen anderen Monat als die Berechnung (z.B. Korrekturen aus der Aufrollung) und werden deshalb nicht verglichen.</p>
      ${e.andereMonate.map((z) => `<div class="lz-zusatz"><div><div class="lz-quelle">${esc(z.text)}</div><div class="lz-hinweis">${esc(z.grund)}</div></div><div class="r">${fmtE(z.betraege[0])}</div></div>`).join('')}
    </div></details>` : '') +
    `<details class="fold" style="margin-top:4px;"><summary>Erkannten Text anzeigen <span class="sum-meta">${e.text.split('\n').length} Zeilen</span></summary><div class="fold-body"><pre class="lz-text">${esc(e.text) || '(kein Text erkannt)'}</pre></div></details>
    <div class="lz-fuss"><button class="btn" data-lz="neu">Andere Datei</button><span class="spacer"></span><button class="btn" data-lz="schliessen">Verwerfen</button><button class="btn primary" data-lz="bestaetigen">Werte bestätigen und vergleichen</button></div>`
  binde()
  const dlg = offen.dlg
  dlg.querySelector('[data-lz="neu"]').onclick = () => { offen.ergebnis = offen.felder = offen.zusatz = null; zeigeStart() }
  dlg.querySelectorAll('select[data-k]').forEach((sel) => (sel.onchange = () => {
    const f = felder[+sel.dataset.k], k = f.kandidaten[+sel.value]
    const inp = dlg.querySelector(`input[data-i="${sel.dataset.k}"]`); inp.value = k ? fmt(k.wert) : ''; inp.dispatchEvent(new Event('input'))
  }))
  dlg.querySelectorAll('input[data-i]').forEach((inp) => (inp.oninput = () => {
    const f = felder[+inp.dataset.i]; f.eingabe = inp.value
    const p = parseEingabe(inp.value)
    // erkannter Status bleibt, solange der Wert unverändert ist
    f.status = p.fehler ? 'fehler' : (p.wert ?? null) === f.wert ? f.erkanntStatus : 'bearbeitet'
    const [cls, lbl] = STATUS[f.status]; const b = dlg.querySelector(`[data-b="${inp.dataset.i}"]`); b.className = 'badge ' + cls; b.textContent = lbl
    inp.classList.toggle('lz-ungueltig', !!p.fehler)
  }))
  dlg.querySelectorAll('select[data-z]').forEach((sel) => (sel.onchange = () => { zusatz[+sel.dataset.z].wahl = sel.value }))
  dlg.querySelector('[data-lz="bestaetigen"]').onclick = () => {
    const ungueltig = felder.filter((f) => parseEingabe(f.eingabe).fehler)
    if (ungueltig.length) { dlg.querySelector('input.lz-ungueltig')?.focus(); return }
    zeigeVergleich()
  }
}

function bestaetigteWerte() {
  const werte = {}
  offen.felder.forEach((f) => { const p = parseEingabe(f.eingabe); if (p.wert != null) werte[f.key] = f.art === 'summe' && KONFIGURATION.summen[f.key]?.abzug ? Math.abs(p.wert) : p.wert })
  const zusatz = offen.zusatz.filter((z) => z.wahl !== '').map((z) => ({ name: z.text.slice(0, 60), betrag: z.betraege[+z.wahl] }))
  // laut Beleg nur eingeschränkt vergleichbare Summen (z.B. inkl. Aufrollung) samt Begründung
  const eing = offen.felder.filter((f) => f.eingeschraenkt && werte[f.key] != null)
  return { werte, zusatz, eingeschraenkt: eing.map((f) => f.key), hinweise: Object.fromEntries(eing.map((f) => [f.key, f.hinweis])) }
}

function zeigeVergleich() {
  const { api } = offen, s = api.soll(), ist = bestaetigteWerte()
  const v = vergleiche(s, ist, { position: KONFIGURATION.toleranz.position, summe: api.toleranz() })
  const zr = zeitraumHinweis(offen.ergebnis.zeitraeume, s)
  const hinweis = (z) => z.status === 'ok' ? (z.diff === 0 ? 'stimmt überein' : 'stimmt – Rundungsdifferenz')
    : z.status === 'abweichung' ? 'Abweichung – bitte prüfen'
    : z.status === 'eingeschraenkt' ? 'eingeschränkt vergleichbar'
    : z.status === 'kein-ist' ? 'nicht auf dem Lohnzettel erkannt' : 'nur am Lohnzettel – nicht vergleichbar'
  const cls = { ok: 'b-ok', abweichung: 'b-veraltet', eingeschraenkt: 'b-offen', 'kein-ist': 'b-fehlt', 'nur-ist': 'b-offen' }
  const n = v.netto
  offen.dlg.innerHTML = kopf('Vergleich: Berechnung und Lohnzettel', `Soll = Berechnung des Einsatzrechners für ${esc(s.arbeitsMonat.name)}, Ist = deine bestätigten Werte.`) +
    (zr.typ !== 'ok' ? `<div class="callout" style="margin-bottom:10px;">${esc(zr.text)}</div>` : '') +
    (s.leer ? `<div class="callout" style="margin-bottom:10px;">Für ${esc(s.arbeitsMonat.name)} ist noch nichts erfasst – die Differenzen sind daher nicht aussagekräftig.</div>` : '') +
    `<div class="lz-netto"><div><span>Netto berechnet</span><b>${fmtE(n.soll)}</b></div><div><span>Netto laut Lohnzettel</span><b>${fmtE(n.ist)}</b></div><div class="${n.status === 'abweichung' ? 'abw' : ''}"><span>Differenz${n.status === 'eingeschraenkt' ? ' (eingeschränkt vergleichbar)' : ''}</span><b>${n.ist == null ? '—' : fmtD(n.diff)}</b></div></div>` +
    `<div class="table-wrap"><table class="lz-tab"><thead><tr><th>Position</th><th class="r">Soll</th><th class="r">Ist</th><th class="r">Differenz</th><th>Hinweis</th></tr></thead><tbody>
      ${v.zeilen.map((z) => `<tr class="${z.art === 'summe' ? 'sum' : ''}"><td>${esc(z.label)}${z.art === 'lohnart' ? ` <span class="mono">${esc(z.key)}</span>` : ''}</td><td class="r">${fmtE(z.soll)}</td><td class="r">${fmtE(z.ist)}</td><td class="r ${z.status === 'abweichung' ? 'lz-abw' : ''}">${z.diff == null ? '—' : fmtD(z.diff)}</td><td><span class="badge ${cls[z.status]}">${hinweis(z)}</span></td></tr>`).join('')}
    </tbody></table></div>
    ${ist.eingeschraenkt.length ? `<p class="hint">„Eingeschränkt vergleichbar“: ${ist.eingeschraenkt.map((k) => esc(v.zeilen.find((z) => z.key === k)?.label) + ' – ' + esc(ist.hinweise[k])).join('; ')}.</p>` : ''}
    <p class="hint">Toleranz für „stimmt“: ±${fmt(KONFIGURATION.toleranz.position)} € je Position, ±${fmt(api.toleranz())} € bei Brutto, SV, Lohnsteuer und Netto (Einstellungen). Die Differenz wird immer genau angezeigt.</p>
    <p class="hint">Eine Abweichung ist ein Hinweis, kein Beleg für einen Fehler des Arbeitgebers: Der Einsatzrechner schätzt und kennt nicht alle Regeln deines Kollektivvertrags oder Betriebs. Mögliche Ursachen zeigt der Soll-Ist-Vergleich nach dem Übernehmen.</p>
    <div class="lz-fuss"><button class="btn" data-lz="zurueck">Zurück zur Kontrolle</button><span class="spacer"></span><button class="btn" data-lz="schliessen">Schließen ohne Speichern</button><button class="btn primary" data-lz="uebernehmen">In den Soll-Ist-Vergleich übernehmen</button></div>`
  binde()
  offen.dlg.querySelector('[data-lz="zurueck"]').onclick = zeigeKontrolle
  offen.dlg.querySelector('[data-lz="uebernehmen"]').onclick = () => { if (api.uebernehmen(ist) !== false) schliessen() }
}
