// Sichtschutz (Privacy-Blur): verwischt Beträge, Stunden und Prozentwerte nur auf dem Bildschirm.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ladeApp } from './helpers.mjs'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const warte = () => new Promise((r) => setTimeout(r, 0))
const norm = (s) => String(s).replace(/\s+/g, ' ').trim()
const ANSICHTEN = ['erfassen', 'ergebnis', 'monate', 'einstellungen']
const montage = (h, extra = {}) => ({ mode: 'montage', stunden: h, fahrzeit: 0, ...extra })
const mitDaten = () => {
  const a = ladeApp()
  a.dom.window.__tage = { '2026-10-06': montage(11), '2026-10-07': montage(9), '2026-10-11': montage(6) }
  a.run('ladeMonat(9,2026);state.grundgehalt=3000;state.dayMap={"2026-09-08":{mode:"montage",stunden:10,fahrzeit:0}};render();flushAutosave();speichereMonat()')
  a.run('ladeMonat(10,2026);state.grundgehalt=3000;state.dayMap=window.__tage;render();flushAutosave()')
  return a
}
const zeige = async (a, v) => { a.run(`location.hash='${v}';zeigeView()`); await warte() }

// Alle sichtbaren Beträge (zwei Nachkommastellen oder mit € / % / h) außerhalb von .pv, ohne Datumsangaben
const OFFEN = `(root,nurGeld)=>{
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),out=[]
  const re=/[\\u2212+-]?\\d[\\d.,\\u00a0\\u202f]*[.,]\\d{2}(?![\\d.,])|\\d[\\d.,\\u00a0\\u202f]*[\\s\\u00a0\\u202f]?(€|%|h(?![\\p{L}\\d]))/gu
  for(let x=w.nextNode();x;x=w.nextNode()){
    const p=x.parentElement
    const pv=p.closest('.pv')
    if(pv&&!(nurGeld&&pv.dataset.pvK==='z'))continue
    if(p.closest('script,style,option,select,.help,textarea,[hidden],[data-pv-aus]'))continue
    if(nurGeld&&!/€/.test(x.nodeValue)&&!/€/.test(x.nextSibling?.textContent||p.nextElementSibling?.textContent||''))continue
    const t=x.nodeValue.replace(/\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}/g,'')
    for(const m of t.matchAll(re)){ if(nurGeld&&(/(h|%)$/.test(m[0])||/^[\\s\\u00a0\\u202f]*(h|%)/.test(t.slice(m.index+m[0].length))))continue; if(/^[\\u2212+-]?0[\\s\\u00a0\\u202f]?(€|h)?$/u.test(m[0]))continue; out.push(x.nodeValue.trim().slice(0,50)); break }
  }
  return out}`

test('Sichtschutz: Klick auf das Auge wechselt Normal und Privacy, speichert die Stufe und setzt aria-pressed', async () => {
  const a = mitDaten(), d = a.dom.window.document
  const btn = d.getElementById('privacy-btn')
  assert.equal(btn.getAttribute('aria-pressed'), 'false')
  assert.equal(d.documentElement.hasAttribute('data-privacy'), false)
  assert.equal(d.getElementById('theme-btn').closest('.pr-tools').contains(btn), true)
  assert.ok(btn.compareDocumentPosition(d.getElementById('theme-btn')) & 4, 'Auge vor dem Hell/Dunkel-Schalter')
  btn.click(); await warte()
  assert.equal(btn.getAttribute('aria-pressed'), 'true')
  assert.equal(d.documentElement.getAttribute('data-privacy'), 'privacy')
  assert.equal(JSON.parse(a.dom.window.localStorage.getItem('lzr_privacy')), 'privacy')
  btn.click(); await warte()
  assert.equal(btn.getAttribute('aria-pressed'), 'false')
  assert.equal(d.documentElement.hasAttribute('data-privacy'), false)
  assert.equal(d.querySelectorAll('.pv').length, 0, 'Beim Ausschalten bleibt nichts verwischt')
})

test('Sichtschutz: Streng verwischt in allen Ansichten jeden Betrag, jede Stunde und jeden Prozentwert; Privacy alle Geldbeträge', async () => {
  for (const modus of ['privacy', 'streng']) {
    const a = mitDaten(), nurGeld = modus === 'privacy'
    a.run(`privacySetzen('${modus}')`); await warte()
    for (const v of ANSICHTEN) {
      await zeige(a, v)
      const n = a.run(`document.getElementById('view-${v}').querySelectorAll('.pv').length`)
      const offen = JSON.parse(a.run(`JSON.stringify((${OFFEN})(document.getElementById('view-${v}'),${nurGeld}))`))
      assert.ok(n > 0, `${modus} ${v}: nichts erkannt`)
      assert.deepEqual(offen, [], `${modus} ${v}: unverwischte Werte`)
    }
    const kopf = JSON.parse(a.run(`JSON.stringify((${OFFEN})(document.getElementById('monat-kopf'),${nurGeld}))`))
    assert.deepEqual(kopf, [], `${modus} Monatskopf`)
  }
})

test('Sichtschutz Privacy: Zeiten, Stunden, Zeitkonten und Prozentwerte bleiben lesbar, Geld nicht', async () => {
  const a = mitDaten(), d = a.dom.window.document
  a.run("privacySetzen('privacy')"); await warte()
  await zeige(a, 'ergebnis')
  const art = (sel) => JSON.parse(a.run(`JSON.stringify([...document.querySelectorAll('${sel} .pv')].map(e=>e.dataset.pvK))`))
  // Kennzahlen: Netto ist Geld, Arbeitsstunden sind Zeit
  assert.deepEqual(art('#res-netto'), ['g'])
  assert.deepEqual(art('#res-stunden'), ['z'])
  // Zeitkonten-Verlauf ohne Einheit zählt als Zeit
  assert.ok(art('.konto-verlauf').length > 0 && art('.konto-verlauf').every((k) => k === 'z'))
  // Lohnzettel: Einheiten (Stunden) sind Zeit, Satz und Betrag Geld
  const lz = JSON.parse(a.run(`JSON.stringify([...document.querySelectorAll('#lz-table tbody tr')].map(tr=>[...tr.children].map(td=>[...td.querySelectorAll('.pv')].map(e=>e.dataset.pvK).join(''))))`))
  assert.ok(lz.length > 0)
  for (const z of lz) { assert.match(z[2], /^z*$/, 'Einheiten'); assert.match(z[4], /^g$/, 'Betrag') }
  // Monatstabelle: Stunden, ZA Ende und Ruhezeit Ende sind Zeit, auch in der Summenzeile
  await zeige(a, 'monate')
  const jt = JSON.parse(a.run(`JSON.stringify([...document.querySelectorAll('#jahr-table tr')].map(tr=>[...tr.children].map(td=>[...td.querySelectorAll('.pv')].map(e=>e.dataset.pvK).join(''))))`))
  for (const z of jt.filter((z) => z.length >= 7)) assert.match(z.slice(-3).join('') + z[z.length === 9 ? 6 : 0], /^z*$/, 'Zeitspalten: ' + z.join(','))
  // Datum „Di 06.10.“ wird nie verwischt
  await zeige(a, 'ergebnis')
  assert.equal(a.run("[...document.querySelectorAll('#view-ergebnis .pv')].some(e=>/^\\d{1,2}\\.\\d{2}$/.test(e.textContent))"), false)
  // CSS: Privacy hebt das Verwischen für Zeit-Treffer auf, Eingabefelder nur für Geld
  assert.match(html, /html\[data-privacy="privacy"\] \.pv\[data-pv-k="z"\]\{filter:none/)
  assert.match(html, /html\[data-privacy\] :is\(#grundgehalt,#stundensatz,#taggeld[^)]*\):not\(:focus\)\{filter:blur/)
  assert.match(html, /html\[data-privacy="streng"\] :is\([^)]*\) input:is\(\[type="number"\],\[inputmode="decimal"\]\):not\(:focus\)\{filter:blur/)
  void d
})

test('Sichtschutz: Texte bleiben unverändert (textContent mit und ohne Sichtschutz gleich)', async () => {
  const a = mitDaten()
  const lies = async () => { const o = {}; for (const v of ANSICHTEN) { await zeige(a, v); o[v] = norm(a.run(`document.getElementById('view-${v}').textContent`)) } return o }
  await lies()
  const normal = await lies()
  a.run("privacySetzen('streng')"); await warte()
  const priv = await lies()
  a.run("privacySetzen('normal')"); await warte()
  const wieder = await lies()
  for (const v of ANSICHTEN) { assert.equal(priv[v], normal[v], 'privacy ' + v); assert.equal(wieder[v], normal[v], 'wieder normal ' + v) }
})

test('Sichtschutz: Stufe bleibt nach dem Neuladen erhalten, ungültiger Wert fällt auf Normal zurück', async () => {
  const a = ladeApp({ storage: { lzr_privacy: 'streng' } }), d = a.dom.window.document
  await warte()
  assert.equal(d.documentElement.getAttribute('data-privacy'), 'streng')
  assert.equal(d.getElementById('privacy-btn').getAttribute('aria-pressed'), 'true')
  const kaputt = ladeApp({ storage: { lzr_privacy: 'quatsch' } })
  assert.equal(kaputt.dom.window.document.documentElement.hasAttribute('data-privacy'), false)
})

test('Sichtschutz: Menü mit drei Stufen und Hinweis, Escape schließt, Auswahl setzt die Stufe', async () => {
  const a = mitDaten(), d = a.dom.window.document, w = a.dom.window
  const pop = d.getElementById('pv-pop')
  assert.equal(pop.hidden, true)
  d.getElementById('privacy-more').click()
  assert.equal(pop.hidden, false)
  assert.equal(d.getElementById('privacy-more').getAttribute('aria-expanded'), 'true')
  assert.deepEqual([...pop.querySelectorAll('.pv-opt')].map((o) => o.dataset.pv), ['normal', 'privacy', 'streng'])
  assert.match(pop.textContent, /Sichtschutz, keine Zugriffssicherung/)
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  assert.equal(pop.hidden, true)
  d.getElementById('privacy-more').click()
  pop.querySelector('[data-pv="streng"]').click(); await warte()
  assert.equal(d.documentElement.getAttribute('data-privacy'), 'streng')
  assert.equal(pop.hidden, true)
  assert.equal(pop.querySelector('[data-pv="streng"]').getAttribute('aria-checked'), 'true')
  assert.equal(pop.querySelector('[data-pv="normal"]').getAttribute('aria-checked'), 'false')
})

test('Sichtschutz: nach neuem Rendern, im Tagesfenster und in Meldungen verwischt', async () => {
  const a = mitDaten()
  a.run("privacySetzen('privacy')"); await warte()
  await zeige(a, 'ergebnis')
  a.run('ladeMonat(9,2026)'); await warte()
  assert.deepEqual(JSON.parse(a.run(`JSON.stringify((${OFFEN})(document.getElementById('view-ergebnis')))`)), [])
  a.run("document.getElementById('res-netto').textContent='1.234,56 €'"); await warte()
  assert.equal(a.run("document.getElementById('res-netto').querySelector('.pv')!==null"), true)
  a.run('ladeMonat(10,2026)'); await zeige(a, 'erfassen')
  a.run(`openDD('2026-10-06',document.querySelector('[data-key="2026-10-06"]'))`); await warte()
  assert.deepEqual(JSON.parse(a.run(`JSON.stringify((${OFFEN})(document.getElementById('dropdown')))`)), [])
  a.run("toast('Gespeichert: 1.234,56 €')"); await warte()
  assert.equal(a.run("document.getElementById('toast').querySelector('.pv')!==null"), true)
})

test('Sichtschutz: Datum und „0 €“ bleiben lesbar, Prozentwerte verwischt, Hilfetexte und Druck unberührt', async () => {
  const a = mitDaten(), d = a.dom.window.document
  a.run("privacySetzen('privacy')"); await warte()
  const t = d.createElement('p'); t.textContent = 'Fehlende Monate zählen nicht als 0 € und am 01.11.2026 gilt 12,50 € bei 24,6 % und 7 %.'
  d.getElementById('view-monate').appendChild(t); await warte()
  assert.deepEqual([...t.querySelectorAll('.pv')].map((e) => e.textContent + ':' + e.dataset.pvK), ['12,50 €:g', '24,6 %:z', '7 %:z'])
  assert.match(html, /input:is\(\[type="number"\],\[inputmode="decimal"\]\):not\(:focus\)\{filter:blur/)
  assert.match(html, /PV_AUS='[^']*\.help/)
  assert.match(html, /@media print\{html\[data-privacy\] :is\(\.pv,input,svg text[^}]*\{filter:none !important;\}\}/)
})

test('Sichtschutz: Englisch übersetzt Schalter und Menü', async () => {
  const a = ladeApp({ storage: { lzr_settings: { lang: 'en', _saved: 5 } } }), d = a.dom.window.document
  await warte()
  assert.match(d.getElementById('privacy-btn').getAttribute('aria-label'), /^Privacy screen: off/)
  assert.equal(d.querySelector('#pv-pop .pv-opt[data-pv="streng"] b').textContent, 'Strict')
  assert.match(d.querySelector('#pv-pop .pv-hinweis').textContent, /not access protection/)
})

test('Sichtschutz: Pfeiltasten im Menü, Fokus zurück zum Menüknopf, Fokus nach draußen schließt', async () => {
  const a = mitDaten(), d = a.dom.window.document, w = a.dom.window
  d.getElementById('privacy-more').click()
  const opts = [...d.querySelectorAll('#pv-pop .pv-opt')]
  assert.equal(d.activeElement, opts[0])
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
  assert.equal(d.activeElement, opts[1])
  opts[2].click(); await warte()
  assert.equal(d.activeElement, d.getElementById('privacy-more'))
  d.getElementById('privacy-more').click()
  d.getElementById('theme-btn').focus()
  assert.equal(d.getElementById('pv-pop').hidden, true)
})

test('Sichtschutz: „Alle Daten löschen“ entfernt auch die Stufe', async () => {
  const a = mitDaten()
  a.run("privacySetzen('privacy')")
  a.run('allesLoeschen()')
  assert.equal(a.storage().lzr_privacy, undefined)
})
