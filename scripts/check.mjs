// Statische Prüfungen:
//  - JavaScript in index.html und den Modulen unter lohnzettel/ ist syntaktisch gültig
//  - keine persönlichen Einstellungen eingebettet (Datenschutz)
//  - keine Emojis in der Oberfläche
//  - Lohnzettel-Module laden nichts von fremden Servern (Datenschutz)
//  - vendor/ entspricht dem Manifest (feste, unveränderte Bibliotheksversionen)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import vm from 'node:vm'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
let fehler = 0
const fail = (msg) => { console.error('✗ ' + msg); fehler++ }
const ok = (msg) => console.log('✓ ' + msg)

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
scripts.forEach((code, i) => {
  try { new vm.Script(code, { filename: `index.html#script${i}` }); ok(`Script ${i}: Syntax gültig`) }
  catch (e) { fail(`Script ${i}: ${e.message}`) }
})

const embedded = html.match(/<script id="embedded-settings" type="application\/json">([\s\S]*?)<\/script>/)
if (!embedded) fail('Block "embedded-settings" fehlt')
else if (embedded[1].trim() !== '{}') fail('Persönliche Einstellungen sind in index.html eingebettet – bitte vor dem Commit entfernen')
else ok('Keine persönlichen Einstellungen eingebettet')

const emoji = html.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
if (emoji) fail(`Emoji gefunden: ${emoji[0]}`)
else ok('Keine Emojis')

const modulDir = new URL('../lohnzettel/', import.meta.url)
for (const f of readdirSync(modulDir).filter((f) => f.endsWith('.mjs'))) {
  const pfad = new URL(f, modulDir)
  try { execFileSync(process.execPath, ['--check', pfad.pathname], { stdio: 'pipe' }); ok(`lohnzettel/${f}: Syntax gültig`) }
  catch (e) { fail(`lohnzettel/${f}: ${e.stderr}`) }
  const code = readFileSync(pfad, 'utf8')
  const extern = code.match(/(https?:)?\/\/(?!\/)[a-z0-9.-]+\.[a-z]{2,}\b/i)
  if (extern) fail(`lohnzettel/${f}: externe Adresse ${extern[0]} – Dokumente dürfen nur lokal verarbeitet werden`)
  if (code.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)) fail(`lohnzettel/${f}: Emoji gefunden`)
}
ok('Lohnzettel-Module ohne externe Adressen')

const manifestPfad = new URL('../vendor/manifest.json', import.meta.url)
if (!existsSync(manifestPfad)) fail('vendor/manifest.json fehlt – npm run vendor ausführen')
else {
  const { dateien, versionen } = JSON.parse(readFileSync(manifestPfad, 'utf8'))
  const abweichend = Object.entries(dateien).filter(([p, h]) => {
    const u = new URL('../vendor/' + p, import.meta.url)
    return !existsSync(u) || createHash('sha256').update(readFileSync(u)).digest('hex') !== h
  })
  if (abweichend.length) fail(`vendor/: ${abweichend.length} Datei(en) fehlen oder weichen ab, z.B. ${abweichend[0][0]} – npm run vendor ausführen`)
  else ok(`vendor/: ${Object.keys(dateien).length} Dateien unverändert (${Object.entries(versionen).map(([k, v]) => k + ' ' + v).join(', ')})`)
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).devDependencies
  for (const k of ['tesseract.js', 'pdfjs-dist']) if (!versionen[k] || versionen[k] !== pkg[k]) fail(`vendor/: ${k} ${versionen[k]} passt nicht zu package.json (${pkg[k]}) – npm run vendor ausführen`)
}

if (fehler) { console.error(`\n${fehler} Problem(e) gefunden`); process.exit(1) }
console.log('\nAlle Prüfungen bestanden')
