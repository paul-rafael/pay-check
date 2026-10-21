// Kopiert die Bibliotheken für den Lohnzettel-Abgleich aus node_modules nach vendor/.
// GitHub Pages liefert das Repository ohne Build-Schritt aus – deshalb liegen die Dateien
// im Repository. Ausführen nach jeder Versionsänderung in package.json: npm run vendor
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const nm = (p) => join(root, 'node_modules', p)
const out = join(root, 'vendor')
const version = (p) => JSON.parse(readFileSync(nm(p + '/package.json'), 'utf8')).version

const DATEIEN = [
  // Tesseract.js: Hauptskript, Worker und WebAssembly-Kern (LSTM, mit/ohne SIMD – der Worker wählt passend zum Browser)
  ['tesseract.js/dist/tesseract.min.js', 'tesseract/tesseract.min.js'],
  ['tesseract.js/dist/worker.min.js', 'tesseract/worker.min.js'],
  ['tesseract.js/LICENSE.md', 'tesseract/LICENSE.md'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract/core/tesseract-core-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract/core/tesseract-core-simd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract/core/tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['tesseract.js-core/LICENSE', 'tesseract/core/LICENSE'],
  // Deutsche Sprachdaten (tessdata_best, ganzzahlig quantisiert – klein und genau)
  ['@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz', 'tesseract/lang/deu.traineddata.gz'],
  // PDF.js: Bibliothek, Worker, Dekoder für gescannte PDFs (JBIG2, JPEG 2000), Standardschriften
  ['pdfjs-dist/legacy/build/pdf.min.mjs', 'pdfjs/pdf.min.mjs'],   // legacy-Build: läuft auch in älteren Browsern
  ['pdfjs-dist/legacy/build/pdf.worker.min.mjs', 'pdfjs/pdf.worker.min.mjs'],
  ['pdfjs-dist/LICENSE', 'pdfjs/LICENSE'],
  ['pdfjs-dist/wasm/jbig2.wasm', 'pdfjs/wasm/jbig2.wasm'],
  ['pdfjs-dist/wasm/openjpeg.wasm', 'pdfjs/wasm/openjpeg.wasm'],
  ['pdfjs-dist/wasm/qcms_bg.wasm', 'pdfjs/wasm/qcms_bg.wasm'],
  ['pdfjs-dist/wasm/jbig2_nowasm_fallback.js', 'pdfjs/wasm/jbig2_nowasm_fallback.js'],
  ['pdfjs-dist/wasm/openjpeg_nowasm_fallback.js', 'pdfjs/wasm/openjpeg_nowasm_fallback.js'],
  ['pdfjs-dist/wasm/LICENSE_JBIG2', 'pdfjs/wasm/LICENSE_JBIG2'],
  ['pdfjs-dist/wasm/LICENSE_OPENJPEG', 'pdfjs/wasm/LICENSE_OPENJPEG'],
  ['pdfjs-dist/wasm/LICENSE_QCMS', 'pdfjs/wasm/LICENSE_QCMS'],
  ['pdfjs-dist/standard_fonts', 'pdfjs/standard_fonts'],
  ['pdfjs-dist/iccs', 'pdfjs/iccs'],
]

rmSync(out, { recursive: true, force: true })
for (const [von, nach] of DATEIEN) {
  mkdirSync(join(out, nach, '..'), { recursive: true })
  cpSync(nm(von), join(out, nach), { recursive: true })
}

// Manifest mit Versionen und SHA-256 – wird von scripts/check.mjs geprüft
const dateien = {}
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f)
  if (statSync(p).isDirectory()) walk(p)
  else if (!p.endsWith('manifest.json')) dateien[relative(out, p)] = createHash('sha256').update(readFileSync(p)).digest('hex')
})
walk(out)
const manifest = {
  hinweis: 'Automatisch erzeugt von scripts/vendor.mjs – nicht von Hand ändern',
  versionen: {
    'tesseract.js': version('tesseract.js'),
    'tesseract.js-core': version('tesseract.js-core'),
    '@tesseract.js-data/deu': version('@tesseract.js-data/deu') + ' (4.0.0_best_int)',
    'pdfjs-dist': version('pdfjs-dist'),
  },
  dateien,
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log('vendor/ aktualisiert:', Object.keys(dateien).length, 'Dateien', manifest.versionen)
