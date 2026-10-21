// Konfiguration für das Auslesen eines Lohnzettels.
//
// WICHTIG: Diese Ausgangskonfiguration ist noch NICHT an einem echten Lohnzettel geprüft.
// Sie enthält bewusst keine Seitenkoordinaten und keine erfundenen Positionsbezeichnungen:
//  - Lohnart-Codes stammen ausschließlich aus der Berechnung des Einsatzrechners (lohnartZeilen),
//    erkannt wird nur ein Code am Zeilenanfang, der im berechneten Lohnzettel des Monats vorkommt.
//  - Für Summenfelder werden nur allgemeine Begriffe gesucht. Trifft ein Begriff in mehreren
//    Zeilen zu, gilt das Feld als mehrdeutig – es wird nichts geraten.
// Anpassen, sobald ein geschwärzter echter Lohnzettel zum Abgleich vorliegt.

// Begriffe, die auf eine Bemessungsgrundlage oder Jahreswerte hinweisen – solche Zeilen sind keine Beträge des Monats
const GRUNDLAGE = [/grundlage/i, /bemessung/i, /\bbmg\b/i, /\bbasis\b/i, /jahres/i, /kumul/i, /aufroll/i, /\bsumme\s+bisher\b/i]

export const KONFIGURATION = {
  version: 1,
  geprueft: false,

  // Lohnart-Code am Zeilenanfang (3–4 Ziffern, danach Leerzeichen)
  lohnartCode: /^\s*(\d{3,4})(?=\s)/,

  // Summenfelder: Zeile passt, wenn ein Muster trifft und kein Ausschluss
  summen: {
    brutto: { label: 'Brutto gesamt', muster: [/\bbrutto\b/i], ausschluss: [...GRUNDLAGE, /\bsv[-\s]?brutto\b/i, /\blst[-\s]?brutto\b/i] },
    sv: { label: 'Sozialversicherung', muster: [/sozialversicherung/i, /\bsv\b/i], ausschluss: [...GRUNDLAGE, /dienstgeber/i, /\bdg\b/i], abzug: true },
    lst: { label: 'Lohnsteuer', muster: [/lohnsteuer/i, /\blst\b/i], ausschluss: [...GRUNDLAGE], abzug: true },
    netto: { label: 'Netto / Auszahlung', muster: [/\bnetto\b/i, /auszahlung/i], ausschluss: [...GRUNDLAGE] },
  },

  // Unter dieser OCR-Konfidenz (0–100) gilt ein Betrag als unsicher
  minKonfidenz: 80,

  // Toleranz für „stimmt überein“ – Differenzen werden trotzdem immer exakt angezeigt
  toleranz: { position: 0.05 },

  // Grenzen für Dateien und Bilder
  grenzen: {
    maxDateiMB: 15,
    maxSeiten: 5,
    maxPixel: 3600,      // längste Bildseite für die Texterkennung
    minBreite: 1700,     // schmalere Bilder werden für die Texterkennung hochskaliert
    pdfScale: 2.5,       // Rendermaßstab für gescannte PDF-Seiten (≈ 180 dpi), danach auf maxPixel begrenzt
  },

  // Tesseract: Seitensegmentierung 6 = einheitlicher Textblock (hält Tabellenzeilen zusammen)
  ocr: { sprache: 'deu', psm: '6' },
}

export const MONATSNAMEN = ['jänner|januar', 'februar|feber', 'märz|maerz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember']
