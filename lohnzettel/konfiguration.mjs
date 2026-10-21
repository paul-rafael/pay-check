// Konfiguration für das Auslesen eines Lohnzettels.
//
// Allgemeine Zuordnung (KONFIGURATION): noch NICHT an einem echten Lohnzettel geprüft.
// Layout „Abrechnungsbeleg“ (LAYOUTS): an einem echten, digitalen Beleg geprüft (nicht im Repository).
// Sie enthält bewusst keine Seitenkoordinaten und keine erfundenen Positionsbezeichnungen:
//  - Lohnart-Codes stammen ausschließlich aus der Berechnung von Pay-Check (lohnartZeilen),
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

// ── Bekannte Beleg-Layouts ───────────────────────────────────────────────────
// Abgeleitet aus einem echten (nicht im Repository enthaltenen) Abrechnungsbeleg.
// Spalten werden über die Überschriften im Dokument bestimmt, nicht über feste Koordinaten.
export const LAYOUTS = [{
  id: 'abrechnungsbeleg',
  name: 'Abrechnungsbeleg (Lohnart · Einheiten · Satz/BMG · Abzüge · Bezüge)',
  // alle Muster müssen im Dokument vorkommen
  // Beschriftungen tolerieren typische OCR-Verwechslungen (ü/u, l/I); Beträge werden davon nicht berührt
  erkennung: [/A\s*B\s*R\s*E\s*C\s*H\s*N\s*U\s*N\s*G\s*S\s*B\s*E\s*L\s*E\s*G/i, /Lohnart\s+Bezeichnung/i, /Bez[üu]ge/i],
  kopfzeile: /Lohnart\s+Bezeichnung/i,
  spalten: { einheiten: /^Einheiten$/i, satz: /^Satz\s*\/\s*BMG$/i, abzuege: /^Abz[üu]ge$/i, bezuege: /^Bez[üu]ge$/i },
  // Monatskennung vor der Bezeichnung bei aufgerollten Positionen, z.B. „02*“ = Februar
  rollung: /^(\d{2})\s?[*°"'’‘]\s*/,   // OCR liest den Stern teils als ° oder Anführungszeichen
  rollungsSeite: /Summe aller Rollungsmonate/i,
  laufenderMonat: /für den Zeitraum\s+(\S+)\s+(20\d{2})/i,
  // Aufrollungsseite allein: Monat und Jahr stehen getrennt
  abrechnungsmonat: /Abrechnungsmonat\s+(\S+)/i,
  rollungsJahr: /Rollungsmonate\s+(20\d{2})/i,
  // ab diesen Überschriften folgen Jahres- bzw. Dienstgeberwerte – nicht auswerten
  ende: [/\bJahres(summen)?\b/i, /\bDienstgeberanteile\b/i],   // als Wort(anfang), auch bei OCR-Fehlern wie „Jahres sa“
  // Summenfelder: Beschriftung (exakt) → Wert in derselben Zeile rechts oder direkt darunter
  summen: {
    bezuege: /^Summe\s*Bez[üu]ge$/i,
    sv: /^SV\s*Gesamt$/i,
    lst: /^LSt\s*[lI1|]fd$/i,
    auszahlung: /^Auszahlung$/i,
    differenz: /^(Differenz aus Vormonaten|Auszahlungsdifferenz)$/i,
  },
  // Lohnart am Beleg → Lohnart der Berechnung (mehrere Zeilen derselben Ziel-Lohnart werden addiert)
  aliase: {
    1060: '9010',   // Homeoffice-Pauschale
    5041: '5040',   // Taggeld, steuerpflichtiger Teil – der Rechner führt das Taggeld gesamt unter 5040
  },
  // Dienstgeber- bzw. Informationszeilen ohne Bezug
  ignorieren: ['9200', '9210'],
}]

export const MONATSNAMEN = ['jänner|januar', 'februar|feber', 'märz|maerz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember']
