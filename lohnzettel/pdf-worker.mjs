// Startmodul für den PDF.js-Worker: zuerst die Stream-Ergänzung für Safari, dann PDF.js selbst.
// (Importe werden in dieser Reihenfolge ausgewertet.)
import './stream-polyfill.mjs'
import '../vendor/pdfjs/pdf.worker.min.mjs'
