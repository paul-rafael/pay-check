<div align="center">

# Einsatzrechner

Einsätze erfassen. Lohn nachrechnen. Lohnzettel prüfen.

<a href="https://paul-rafael.github.io/einsatzrechner/"><img alt="Live-Demo" src="https://img.shields.io/badge/Live--Demo-%C3%B6ffnen-8a0b18?style=for-the-badge"></a>
<a href="https://github.com/paul-rafael/einsatzrechner/releases/latest"><img alt="Version" src="https://img.shields.io/github/v/release/paul-rafael/einsatzrechner?style=for-the-badge&color=0a0a0a&label=Version"></a>
<a href="https://github.com/paul-rafael/einsatzrechner/actions/workflows/ci.yml"><img alt="Tests" src="https://img.shields.io/github/actions/workflow/status/paul-rafael/einsatzrechner/ci.yml?branch=main&style=for-the-badge&label=Tests&color=0a0a0a"></a>
<a href="LICENSE"><img alt="Lizenz MIT" src="https://img.shields.io/badge/Lizenz-MIT-0a0a0a?style=for-the-badge"></a>

**[Einsatzrechner öffnen →](https://paul-rafael.github.io/einsatzrechner/)**

<img alt="Einsatzrechner – Netto-Ergebnis, Kalender und Zeitkonten" src="docs/screenshot.png" width="760">

</div>

---

Der Einsatzrechner ist ein privates Werkzeug für alle, die auf Montage, auf Reise oder im Schichtmodell arbeiten und ihren Lohn nach österreichischem Recht nachrechnen wollen. Du trägst die Arbeitstage eines Monats in einen Kalender ein – Büro, Homeoffice, Montage, Reise, Zeitausgleich – und siehst sofort den voraussichtlichen Lohnzettel mit Zuschlägen, Zulagen, Zeitkonten und einer Netto-Schätzung. Danach vergleichst du ihn mit deinem echten Lohnzettel und behältst in der Jahresübersicht Einkommen und Zeitkonten im Blick.

Der Rechner ist eine einzige HTML-Datei: ohne Installation, ohne Server, ohne Konto.

## Funktionen

| Bereich | Beschreibung |
| --- | --- |
| Erfassen | Kalender mit Tagesdetails, Arbeitsmodelle, Einsatzland, Bezahlung und Zeitkonten – das geschätzte Netto steht immer oben |
| Ergebnis | Netto als Hauptzahl, Brutto, Abzüge und steuerfreie Anteile; vollständiger Lohnzettel, Brutto-Netto-Rechnung und Soll-Ist-Vergleich |
| Kalender | Büro, Homeoffice, Montage, Montage mit Reise, Zeitausgleich und Ruhezeit mit Farbe und Kürzel; Tage kopieren und einfügen |
| Arbeitsmodelle | 5/2, 10/4, 6/1/4/3 und eigene Modelle; einmalig oder fortlaufend über Monatsgrenzen; früheren Monat als Vorlage |
| Arbeitszeit | Normalarbeitszeit Mo–Do 8,25 h, Fr 5,5 h; Mehrstunden in den ZA-Topf; Überstunden über 10 h/Tag und 50 h/Woche |
| Zuschläge | Samstag 50 %, Sonntag und Feiertag 100 %, Lenkzeit, Zulagen, Prämien; Sätze in den erweiterten Einstellungen änderbar |
| Zeitkonten | ZA- und Ruhezeit-Topf mit Start, Zugängen, Entnahmen und Ende; automatischer Übertrag in den Folgemonat |
| Feiertage | Österreich; an Montage-Tagen im Ausland nur die Feiertage des Einsatzlandes: DE (je Bundesland), CH, FR, IT, NL, BE, LU, ES |
| Netto | SV mit Höchstbeitragsgrundlage, Lohnsteuer-Tarif, steuerfreie Zuschläge nach §68, Taggeld, Urlaubsgeld nach §67 – Werte je Steuerjahr (2025, 2026) |
| Soll-Ist-Vergleich | Beträge des echten Lohnzettels je Lohnart eintragen, Differenzen nach Bereichen mit möglichen Ursachen, Abweichungen als geklärt markieren |
| Lohnzettel einlesen | PDF, Scan oder Fotos lokal im Browser auslesen (PDF-Textebene bzw. Texterkennung), Werte im Kontrollfenster prüfen und mit der Berechnung vergleichen – inkl. Aufrollung von Vormonaten; Vorschau-Funktion, siehe unten |
| Jahresübersicht | Jahresbrutto, -netto, Taggeld, SV, Lohnsteuer, Zuschläge; Netto je Monat, Zeitkonten-Verlauf, Monatstabelle; fehlende Monate zählen nicht als 0 € |
| Gespeicherte Monate | Jahresübersicht und alle Monate mit Status offen / gespeichert / abgerechnet / geändert / veraltet; Monate vergleichen; bewusste Neuberechnung mit Verlauf |
| Hinweise | Warnungen bei über 12 h am Tag, über 60 h pro Woche, vollem ZA-Topf, fehlendem Taggeld; alle Annahmen sichtbar |
| Daten | Automatisches Speichern im Browser, CSV und PDF für Monat und Jahr, Gesamtsicherung, Import, vollständiges Löschen |
| Lehrlinge | Reduzierter SV-Satz per Schalter |

## Highlights

- **Nachvollziehbar** – steuerfreie Anteile werden einzeln ausgewiesen, z. B. „von 1.272,96 € – Rest 1.102,96 € steuerpflichtig“.
- **Aktuelle Werte** – Sozialversicherung, Lohnsteuer und §68-Grenzen je Steuerjahr, Taggeld-Sätze je Land, mit Quellen.
- **Ehrlich** – Schätzungen sind gekennzeichnet, Annahmen werden angezeigt, gespeicherte Abrechnungen ändern sich nie von selbst.
- **Privat** – keine Anmeldung, kein Tracking, keine externen Skripte. Daten bleiben im eigenen Browser.
- **Offline** – die Datei funktioniert auch ohne Internet, z. B. auf Montage.
- **Geprüft** – Rechen-Tests laufen bei jeder Änderung automatisch.

<details>
<summary>Jahresübersicht</summary>
<br>
<img alt="Jahresübersicht mit Netto je Monat" src="docs/jahresuebersicht.png" width="760">
</details>

## Nutzung

**Online:** [paul-rafael.github.io/einsatzrechner](https://paul-rafael.github.io/einsatzrechner/)

**Offline:** `einsatzrechner.html` aus dem [neuesten Release](https://github.com/paul-rafael/einsatzrechner/releases/latest) herunterladen und im Browser öffnen.

1. In den **Einstellungen** (Zahnrad) einmal Grundgehalt, Taggeld, Standard-Stunden und Arbeitsmodell eintragen.
2. Unter **Erfassen** Tage anklicken oder ein Arbeitsmodell setzen – Eingaben werden automatisch gespeichert, das Netto steht sofort oben.
3. Bei Einsätzen im Ausland das **Einsatzland** wählen.
4. Unter **Ergebnis** den Monat speichern, im **Soll-Ist-Vergleich** mit dem Lohnzettel prüfen und als **abgerechnet** markieren.
5. Unter **Gespeicherte Monate** Jahr, Einkommen und Zeitkonten verfolgen.

## Entwicklung

```bash
npm install      # Test-Umgebung und Bibliotheken für den Lohnzettel-Abgleich
npm start        # lokale Vorschau auf http://localhost:3000
npm run check    # Syntax-, Datenschutz-, Emoji- und Bibliotheksprüfung
npm test         # Rechen-, Funktions- und Parsertests
npm run vendor   # nach einem Versionswechsel von Tesseract.js oder PDF.js: vendor/ neu erzeugen
```

**Kein Build-Schritt, Deployment über GitHub Pages:** Pages liefert den Branch `main` unverändert aus (`.nojekyll` schaltet Jekyll ab). Die Bibliotheken für den Lohnzettel-Abgleich liegen deshalb fertig in `vendor/` im Repository – feste Versionen, Prüfsummen in `vendor/manifest.json`, von `npm run check` kontrolliert. Nach einem Push auf `main` ist die neue Version nach ein bis zwei Minuten online.

**Lokale Vorschau:** `index.html` lässt sich direkt öffnen. Für „Lohnzettel einlesen“ braucht es aber einen Webserver (`npm start` oder `python3 -m http.server`), weil Browser JavaScript-Module und Worker nicht aus `file://` laden. Aus demselben Grund funktioniert diese Funktion nicht in der heruntergeladenen Einzeldatei `einsatzrechner.html`.

### Lohnzettel einlesen (Vorschau)

- Läuft vollständig im Browser: PDF.js liest digitale PDFs über ihre Textebene, gescannte Seiten und Fotos erkennt Tesseract.js (deutsch, LSTM). Vor der Texterkennung werden Bilder begradigt, in Graustufen mit Kontrastspreizung umgewandelt und Tabellenlinien entfernt. Mehrseitige Belege: ein PDF oder bis zu fünf Fotos gemeinsam. Es gibt keinen Server, keinen Upload und keine externen Dienste; alle Bibliotheken, Worker und Sprachdaten kommen aus `vendor/`.
- Module in `lohnzettel/`: `stream-polyfill.mjs` und `pdf-worker.mjs` (Safari-Kompatibilität für PDF.js), `konfiguration.mjs` (Zuordnungsregeln), `parser.mjs` (Zahlenformat, Zeilen, Zuordnung, Vergleich – ohne Browser testbar), `ocr.mjs` (Laden, Bildaufbereitung, Texterkennung, Freigabe), `ui.mjs` (Kontrollfenster und Vergleich).
- **Layout „Abrechnungsbeleg“** (Spalten Lohnart · Einheiten · Satz/BMG · Abzüge · Bezüge): Spalten werden über die Überschriften im Dokument bestimmt, nicht über feste Koordinaten. Aufgerollte Positionen mit Monatskennung (`02*` = Februar) werden dem Arbeitsmonat zugeordnet, andere Monate nicht verglichen. Aliase: 1060 → 9010 (Homeoffice), 5041 + 5040 (Taggeld gesamt). Summen (Summe Bezüge, SV Gesamt, LSt lfd, Auszahlung) über alle Seiten; Jahres- und Dienstgeberwerte sind ausgeschlossen. Summen mit Aufrollung gelten als „eingeschränkt vergleichbar“.
- **Andere Lohnzettel:** allgemeine Zuordnung über Lohnart-Codes am Zeilenanfang und allgemeine Begriffe – an echten Belegen anderer Lohnsoftware noch nicht geprüft.
- **Geprüft** an einem echten Abrechnungsbeleg (nicht im Repository): digitales PDF, gescanntes PDF und zwei Handyfotos – alle 11 Werte korrekt, keine externen Anfragen. Stark verkleinerte, unscharfe Fotos werden nicht gelesen; dabei wird aber auch kein falscher Wert angezeigt. Die Tests in `tests/lohnzettel.test.mjs` verwenden ausschließlich synthetische Daten mit gleicher Struktur.
- Mehrdeutige, unsichere oder fehlende Werte werden gekennzeichnet, nie geraten. Eindeutige OCR-Fehler (Punkt statt Komma, Störzeichen nach dem Betrag) werden gelesen, aber immer als „unsicher“ markiert.

Tests laufen bei jedem Push über GitHub Actions. Hinweise zum Mitwirken stehen in [CONTRIBUTING.md](CONTRIBUTING.md).

## Projektstruktur

```
index.html              Der Rechner (eine Datei): Rechenkern und Oberfläche als getrennte Skripte, inkl. PRH Design Kit
lohnzettel/             Lohnzettel einlesen: Konfiguration, Parser, OCR, Oberfläche (ES-Module, nur bei Bedarf geladen)
vendor/                 Tesseract.js, Sprachdaten deu, PDF.js – feste Versionen, erzeugt von scripts/vendor.mjs
docs/                   Screenshots und Vorschaubild
tests/                  Rechen- und Funktionstests (node:test + jsdom), Referenzwerte in tests/fixtures/
scripts/check.mjs       Statische Prüfungen
scripts/vendor.mjs      Kopiert die Bibliotheken aus node_modules nach vendor/
.github/                CI- und Release-Workflow, Issue- und PR-Vorlagen
```

## Dokumentation

**Rechengrundlagen 2026** (die Werte 2025 sind ebenfalls hinterlegt und unter Einstellungen einsehbar)

| Thema | Wert |
| --- | --- |
| SV-Dienstnehmeranteil | 18,07 % (Sonderzahlungen 17,07 %), reduzierter AV-Anteil bei geringem Einkommen |
| Höchstbeitragsgrundlage | 6.930 € monatlich, 13.860 € jährlich für Sonderzahlungen |
| Lohnsteuer | Tarif 2026 (0 / 20 / 30 / 40 / 48 / 50 / 55 %), Verkehrsabsetzbetrag 496 €, Werbungskostenpauschale |
| §68 Abs. 1 EStG | Sonn- und Feiertagszuschläge inkl. Feiertagsarbeitsentgelt bis 400 € steuerfrei |
| §68 Abs. 2 EStG | Überstundenzuschläge der ersten 15 Stunden, höchstens 170 € steuerfrei |
| Taggeld | Steuer- und SV-frei bis zum Inlandssatz (30 €) bzw. Auslandsreisesatz |
| Sonderzahlungen §67 | 6 % nach Abzug der SV, 620 € Freibetrag, 2.100 € Freigrenze |
| Stundensatz | Grundgehalt ÷ 143 (einstellbar) |

Quellen: [ÖGK – Veränderliche Werte 2026](https://www.oegk.at/cdscontent/?contentid=10007.908421&portal=oegkdgportal) · [WKO – Beitragswesen 2026](https://www.wko.at/entlohnung/beitragswesen-dienstnehmer-2026) · [WKO – Auslandsreisesätze](https://www.wko.at/entlohnung/auslandsreise-kostensaetze) · [Sozialversicherung – Lehrlinge](https://www.sozialversicherung.gv.at/cdscontent/?contentid=10007.905068)

**Weitere Dokumente:** [CHANGELOG.md](CHANGELOG.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [LICENSE](LICENSE)

**Haftungsausschluss:** Alle Ergebnisse sind Näherungswerte. Kollektivverträge, Betriebsvereinbarungen und persönliche Absetzbeträge (z. B. Pendlerpauschale, Familienbonus Plus) können zu Abweichungen führen. Der Einsatzrechner ersetzt keine Lohn- oder Steuerberatung; verbindlich ist ausschließlich die Abrechnung des Arbeitgebers.

---

<p align="center"><sub>Entwickelt von <b>Paul-Rafael Hasan-Man</b></sub></p>
