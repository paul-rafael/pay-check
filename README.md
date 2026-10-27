<div align="center">

# Pay-Check

Einsätze erfassen. Lohn nachrechnen. Lohnzettel prüfen.

<a href="https://paul-rafael.github.io/pay-check/"><img alt="Live-Demo" src="https://img.shields.io/badge/Live--Demo-%C3%B6ffnen-8a0b18?style=for-the-badge"></a>
<a href="https://github.com/paul-rafael/pay-check/releases/latest"><img alt="Version" src="https://img.shields.io/github/v/release/paul-rafael/pay-check?style=for-the-badge&color=0a0a0a&label=Version"></a>
<a href="https://github.com/paul-rafael/pay-check/actions/workflows/ci.yml"><img alt="Tests" src="https://img.shields.io/github/actions/workflow/status/paul-rafael/pay-check/ci.yml?branch=main&style=for-the-badge&label=Tests&color=0a0a0a"></a>
<a href="LICENSE"><img alt="Lizenz: nicht kommerziell" src="https://img.shields.io/badge/Lizenz-nicht%20kommerziell-0a0a0a?style=for-the-badge"></a>

**[Pay-Check öffnen →](https://paul-rafael.github.io/pay-check/)**

<img alt="Pay-Check – Netto-Ergebnis, Arbeitskalender und Zeitkonten" src="docs/screenshot.png" width="760">

</div>

---

Pay-Check ist ein privates Werkzeug für alle, die auf Montage, auf Reise oder im Schichtmodell arbeiten und ihren Lohn nach österreichischem Recht nachrechnen wollen. Du trägst die Arbeitstage eines Monats in einen Kalender ein – Büro, Homeoffice, Montage, Reise, Zeitausgleich – und siehst sofort den voraussichtlichen Lohnzettel mit Zuschlägen, Zulagen, Zeitkonten und einer Netto-Schätzung. Danach vergleichst du ihn mit deinem echten Lohnzettel und behältst in der Jahresübersicht Einkommen und Zeitkonten im Blick.

Der Rechner ist eine einzige HTML-Datei: ohne Installation, ohne Server, ohne Konto.

## Funktionen

| Bereich | Beschreibung |
| --- | --- |
| Erfassen | Kalender über die volle Breite mit Tagesdetails, Arbeitsmodell und Einsatzland; Zeitkonten direkt darunter, Bezahlung kompakt – Netto und Arbeitsstunden stehen immer oben |
| Ergebnis | Netto als Hauptzahl, Brutto, Abzüge und steuerfreie Anteile; vollständiger Lohnzettel, Brutto-Netto-Rechnung und Soll-Ist-Vergleich |
| Kalender | Büro, Homeoffice, Montage, Montage mit Reise, Zeitausgleich und Ruhezeit mit Farbe und Kürzel; Tage kopieren und einfügen |
| Zeiten importieren | Zeitnachweis aus der Zeiterfassung (PDF oder Foto) lokal einlesen: Datum, Tagesprogramm, Abwesenheit, Kommt/Geht und Stunden (Format Stunden,Minuten). Codes einmal einer Tagesart zuordnen – die Zuordnung wird gemerkt – und die Tage in den Kalender einfügen |
| Arbeitsmodelle | 5/2, 10/4, 6/1/4/3 und eigene Modelle; einmalig oder fortlaufend über Monatsgrenzen; früheren Monat als Vorlage |
| Arbeitszeit | Normalarbeitszeit Mo–Do 8,25 h, Fr 5,5 h; Mehrstunden in den ZA-Topf; Überstunden über 10 h/Tag und 50 h/Woche |
| Zuschläge | Samstag 50 %, Sonntag und Feiertag 100 %, Lenkzeit, Zulagen, Prämien; Sätze in den erweiterten Einstellungen änderbar |
| Montageprämie | 500 € je 30 Tage, aliquot je Montage-Tag (Lohnart 1050, laufender Bezug); Betrag in den erweiterten Einstellungen änderbar |
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
| Erklärungen | Ein kleines „i“ in der Ecke jeder Funktion und neben wichtigen Feldern erklärt per Klick, wofür sie da ist |
| Darstellung | Ruhiges, helles Design mit Bordeaux als Akzent; dunkle Darstellung wählbar; am Handy eigene Navigationsleiste |
| Sprache | Deutsch (Standard) oder Englisch, umschaltbar in den Einstellungen – inklusive Zahlenformat und CSV-Export |

## Highlights

- **Nachvollziehbar** – steuerfreie Anteile werden einzeln ausgewiesen, z. B. „von 1.272,96 € – Rest 1.102,96 € steuerpflichtig“.
- **Aktuelle Werte** – Sozialversicherung, Lohnsteuer und §68-Grenzen je Steuerjahr, Taggeld-Sätze je Land, mit Quellen.
- **Ehrlich** – Schätzungen sind gekennzeichnet, Annahmen werden angezeigt, gespeicherte Abrechnungen ändern sich nie von selbst.
- **Privat** – keine Anmeldung, kein Tracking, keine externen Skripte. Daten bleiben im eigenen Browser.
- **Offline** – die Datei funktioniert auch ohne Internet, z. B. auf Montage.
- **Geprüft** – Rechen-Tests laufen bei jeder Änderung automatisch.

## Ansichten

<table>
<tr>
<td width="50%"><b>Ergebnis</b> – berechneter Lohnzettel mit Brutto-Netto-Rechnung<br><br><img alt="Ergebnis mit berechnetem Lohnzettel" src="docs/ergebnis.png"></td>
<td width="50%"><b>Gespeicherte Monate</b> – Jahreswerte und Netto je Monat<br><br><img alt="Jahresübersicht mit Netto je Monat" src="docs/jahresuebersicht.png"></td>
</tr>
<tr>
<td><b>Info-Symbol</b> – jede Funktion erklärt sich per Klick auf „i“<br><br><img alt="Erklärung zum Arbeitskalender über das Info-Symbol" src="docs/info.png"></td>
<td><b>Am Handy</b> – Ergebnis oben, Kalender und Zeitkonten untereinander<br><br><img alt="Pay-Check am Handy" src="docs/handy.png"></td>
</tr>
<tr>
<td colspan="2"><b>Dunkle Darstellung</b> – fast schwarzer Hintergrund, umschaltbar über das Sonnen-/Mond-Symbol oben rechts<br><br><img alt="Pay-Check in dunkler Darstellung" src="docs/dunkel.png"></td>
</tr>
</table>

<sub>Alle Screenshots zeigen Beispieldaten.</sub>

## Nutzung

**Online:** [paul-rafael.github.io/pay-check](https://paul-rafael.github.io/pay-check/)

**Offline:** `pay-check.html` aus dem [neuesten Release](https://github.com/paul-rafael/pay-check/releases/latest) herunterladen und im Browser öffnen.

1. In den **Einstellungen** (Zahnrad) einmal Grundgehalt, Taggeld, Standard-Stunden und Arbeitsmodell eintragen.
2. Unter **Erfassen** Tage anklicken oder ein Arbeitsmodell setzen – Eingaben werden automatisch gespeichert, das Netto steht sofort oben. Unklar, wofür etwas da ist? Auf das kleine **„i“** klicken.
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

**Lokale Vorschau:** `index.html` lässt sich direkt öffnen. Für „Lohnzettel einlesen“ braucht es aber einen Webserver (`npm start` oder `python3 -m http.server`), weil Browser JavaScript-Module und Worker nicht aus `file://` laden. Aus demselben Grund funktioniert diese Funktion nicht in der heruntergeladenen Einzeldatei `pay-check.html`.

### Sprachen

Deutsch ist die Quelle: Alle Texte stehen deutsch im Code. Für Englisch liegt in `index.html` ein Wörterbuch (`<script id="i18n-en">`), das beim Anzeigen jeden Text und jedes Hilfe-Attribut ersetzt – auch später eingefügte Texte, Meldungen und Rückfragen. Zahlen, Monatsnamen und Namen in „…“ sind im Wörterbuch Platzhalter `{}`, damit ein Eintrag für alle Werte passt. Neue Texte: deutschen Text verwenden und den englischen Eintrag ergänzen; `tests/sprache.test.mjs` prüft die Platzhalter. Nicht übersetzt werden Inhalte mit `translate="no"` (z. B. der erkannte Text eines Lohnzettels).

### Lohnzettel einlesen (Vorschau)

- Läuft vollständig im Browser: PDF.js liest digitale PDFs über ihre Textebene, gescannte Seiten und Fotos erkennt Tesseract.js (deutsch, LSTM). Vor der Texterkennung werden Bilder begradigt, in Graustufen mit Kontrastspreizung umgewandelt und Tabellenlinien entfernt. Mehrseitige Belege: ein PDF oder bis zu fünf Fotos gemeinsam. Es gibt keinen Server, keinen Upload und keine externen Dienste; alle Bibliotheken, Worker und Sprachdaten kommen aus `vendor/`.
- Module in `lohnzettel/`: `zeitnachweis.mjs` (Zeitnachweis auswerten – Spalten über die Überschriften, Stunden als Stunden,Minuten) und `zeiten-ui.mjs` (Zeiten importieren), `stream-polyfill.mjs` und `pdf-worker.mjs` (Safari-Kompatibilität für PDF.js), `konfiguration.mjs` (Zuordnungsregeln), `parser.mjs` (Zahlenformat, Zeilen, Zuordnung, Vergleich – ohne Browser testbar), `ocr.mjs` (Laden, Bildaufbereitung, Texterkennung, Freigabe), `ui.mjs` (Kontrollfenster und Vergleich).
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
| Montageprämie | 500 € ÷ 30 × Montage-Tage, steuer- und SV-pflichtig (einstellbar) |

Quellen: [ÖGK – Veränderliche Werte 2026](https://www.oegk.at/cdscontent/?contentid=10007.908421&portal=oegkdgportal) · [WKO – Beitragswesen 2026](https://www.wko.at/entlohnung/beitragswesen-dienstnehmer-2026) · [WKO – Auslandsreisesätze](https://www.wko.at/entlohnung/auslandsreise-kostensaetze) · [Sozialversicherung – Lehrlinge](https://www.sozialversicherung.gv.at/cdscontent/?contentid=10007.905068)

## Lizenz

[PolyForm Noncommercial 1.0.0](LICENSE): Jede und jeder darf Pay-Check kostenlos benutzen, kopieren, verändern und weitergeben – für private Zwecke und für gemeinnützige Organisationen, Schulen oder Behörden. **Kommerzielle Nutzung** (z. B. im Unternehmen, als Teil eines kostenpflichtigen Angebots oder zur Lohnverrechnung für andere) ist nur mit vorheriger schriftlicher Zustimmung erlaubt – Anfragen bitte über ein [Issue](https://github.com/paul-rafael/pay-check/issues). Versionen bis 2.3.3 wurden unter der MIT-Lizenz veröffentlicht und bleiben für diese Kopien MIT-lizenziert.

**Weitere Dokumente:** [CHANGELOG.md](CHANGELOG.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [LICENSE](LICENSE)

**Haftungsausschluss:** Alle Ergebnisse sind Näherungswerte. Kollektivverträge, Betriebsvereinbarungen und persönliche Absetzbeträge (z. B. Pendlerpauschale, Familienbonus Plus) können zu Abweichungen führen. Pay-Check ersetzt keine Lohn- oder Steuerberatung; verbindlich ist ausschließlich die Abrechnung des Arbeitgebers.

---

<p align="center"><sub>Entwickelt von <b>Paul-Rafael Hasan-Man</b></sub></p>
