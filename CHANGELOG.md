# Changelog

Alle wichtigen Änderungen an diesem Projekt. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [3.1.1] – 2026-10-27

### Neu
- Zeiten importieren: Zeitnachweis aus der Zeiterfassung (PDF oder Foto) lokal einlesen und die Tage in den Kalender einfügen. Gelesen werden Datum, Tagesprogramm, Abwesenheit, Kommt/Geht und Stunden (Format Stunden,Minuten). Codes werden einmal einer Tagesart zugeordnet und gemerkt; Stunden lassen sich vor dem Einfügen ändern, bestehende Einträge werden nur nach Rückfrage überschrieben.
- Montageprämie: 500 € je 30 Tage aliquot je Montage-Tag als laufender Bezug (Lohnart 1050), einstellbar unter Einstellungen → Erweiterte Optionen. Gespeicherte Monate mit Montage-Tagen zeigen dadurch „veraltet“ und lassen sich bewusst neu berechnen.

## [3.1.0] – 2026-10-22

### Geändert
- Arbeitsmonat und Lohnzettel klar getrennt: Oben in Erfassen und Ergebnis steht jetzt „Arbeitsmonat Oktober 2026 → Lohnzettel November 2026“ (mit Erklärung über das „i“). Das Feld „Lohnzettel für“ in der Bezahlung entfällt.
- Gespeicherte Monate: kurze Erklärung, dass jede Zeile ein Arbeitsmonat ist und der Lohnzettel meist im Folgemonat kommt. Diagramm „Netto je Arbeitsmonat“ zeigt unter jedem Monat den Lohnzettel-Monat, die Tabelle und die Monatsliste ebenfalls; „Netto laut LZ“ heißt jetzt „Netto laut Lohnzettel“.
- Ergebnis: Lohnzettel-Karte nennt „Lohnzettel November 2026“ statt „für November 2026“.

## [3.0.0] – 2026-10-21

### Geändert
- Neuer Name: **Pay-Check** (vorher Einsatzrechner). Neue Adresse: https://paul-rafael.github.io/pay-check/ – gespeicherte Daten bleiben erhalten, weil sie im Browser unter derselben Domain liegen.
- Lizenz: [PolyForm Noncommercial 1.0.0](LICENSE) statt MIT. Private und gemeinnützige Nutzung bleibt frei, kommerzielle Nutzung nur mit Zustimmung. Bereits unter MIT veröffentlichte Versionen (bis 2.3.3) bleiben MIT-lizenziert.
- Release-Datei heißt jetzt `pay-check.html`, Exporte beginnen mit `Pay-Check_`.

### Neu
- Sprache in den Einstellungen: Deutsch (Standard) oder Englisch. Englisch übersetzt alle Texte, Hilfen, Meldungen und Rückfragen, zeigt Zahlen und Datum im englischen Format und schreibt CSV-Dateien mit Komma als Trenner und Punkt als Dezimalzeichen.

## [2.3.3] – 2026-10-21

### Geändert
- Dunkle Darstellung: Hintergrund fast schwarz (#0A0A0B), Flächen und Linien entsprechend dunkler
- Schrift in der hellen Darstellung wieder wie in 2.3.1
- README: Screenshot der dunklen Darstellung ergänzt

## [2.3.2] – 2026-10-21

### Geändert
- Schrift fast schwarz (#111214), Nebentexte deutlich dunkler – besser lesbar, auch im Freien
- Screenshots in der README aktualisiert

## [2.3.1] – 2026-10-21

### Geändert
- Wieder das bisherige Rot (#8A0B18) als Akzentfarbe, in hell und dunkel
- Etwas dunkleres Grau für Hintergrund, Linien und Nebentexte – mehr Kontrast
- Einsatzland und Bundesland stehen nebeneinander; am Handy nehmen die Kalender-Auswahlfelder die volle Breite ein
- README mit neuen Screenshots (Erfassen, Ergebnis, Jahresübersicht, Info-Symbol, Handy) und neuem Vorschaubild

## [2.3.0] – 2026-10-21

### Geändert
- Ruhigeres Layout: Kalender über die volle Breite, Zeitkonten kompakt darunter (am Handy untereinander)
- Hellere Farben: heller Hintergrund, weiße Flächen mit feiner Kontur statt Schatten, Bordeaux nur noch für aktive Navigation, ausgewählte Tage und wichtige Aktionen; ruhigere Farben für Montage, Zeitausgleich und Büro/Homeoffice
- Ergebnisleiste kompakt: Netto und Arbeitsstunden oben, daneben Brutto, Abzüge und steuerfreie Anteile
- Kalender-Aktionen gebündelt: Arbeitsmodell und Einsatzland als Auswahl, seltene Aktionen im Menü „Kalender“
- Bezahlung: Grundgehalt, Stundensatz, Taggeld und Lohnzettel-Monat in einer Reihe, Sonderzahlungen eingeklappt
- Einheitliche Schriftgrößen, Abstände und Feldhöhen; Darstellung startet hell (Einstellung „automatisch“ bleibt wählbar)

### Neu
- Info-Symbol „i“ in der Ecke jeder Funktion, das per Klick erklärt, was sie macht

Berechnung, gespeicherte Daten und Navigation sind unverändert.

## [2.2.1] – 2026-10-21

### Behoben
- Lohnzettel einlesen in Safari: PDFs brachen mit „undefined is not a function“ ab, weil Safari Datenströme nicht mit `for await` durchlaufen kann, was PDF.js beim Lesen der Textebene und beim Entpacken nutzt. Die fehlende Methode wird jetzt im Hauptfenster und im PDF.js-Worker ergänzt, nur wenn sie fehlt.

## [2.2.0] – 2026-10-21

### Neu
- Lohnzettel einlesen (Vorschau): PDF, Scan oder Foto lokal im Browser auslesen und mit der Berechnung vergleichen
  - digitale PDFs über die Textebene, Scans und Fotos per Texterkennung (Tesseract.js, PDF.js) – ohne Server, ohne Upload, ohne externe Dienste
  - bearbeitbares Kontrollfenster: unsichere, mehrdeutige und fehlende Werte sind gekennzeichnet, nichts wird geraten
  - Vergleich von Soll, Ist und Differenz je Position und für das Netto, Hinweis bei abweichendem Abrechnungsmonat
  - Datei und erkannte Werte werden nicht gespeichert; übernommen wird nur auf ausdrücklichen Klick
  - Layout „Abrechnungsbeleg“ (Lohnart · Einheiten · Satz/BMG · Abzüge · Bezüge) mit Aufrollung von Vormonaten, an einem echten Beleg geprüft (PDF, Scan, Fotos)
  - mehrseitige Belege als PDF oder mehrere Fotos; Bilder werden begradigt und von Tabellenlinien befreit
  - andere Lohnzettel: allgemeine Zuordnung, noch nicht an echten Belegen geprüft
- Statische Prüfung: Lohnzettel-Module ohne externe Adressen, Bibliotheken in `vendor/` mit Prüfsummen

### Geändert
- Soll-Ist-Vergleich auf der Ergebnisseite immer aufgeklappt

## [2.1.0] – 2026-10-20

Neuer Name: **Einsatzrechner** (vorher Gehaltsprüfer). Gespeicherte Daten bleiben erhalten.

### Geändert
- Navigation nach dem Arbeitsablauf: Erfassen, Ergebnis, Gespeicherte Monate, Einstellungen; Hilfe über das Fragezeichen
- Ergebnisleiste: Netto als größte Zahl, Brutto und Abzüge daneben, steuerfreie Anteile separat ausgewiesen
- Am Handy bleibt das Netto beim Scrollen in einer schmalen Leiste sichtbar
- Bessere Lesbarkeit: dunklere Grautöne für Beschriftungen, Hinweise und Tabellenköpfe (mindestens 4,5:1 Kontrast)
- Kalender: deutlichere Farben je Tagesart, klar markierter ausgewählter Tag, heutiger Tag, Wochenenden und Feiertage subtil abgesetzt, Legende am Handy in Spalten
- Gespeicherte Monate: Jahresübersicht und Monatsliste auf einer Seite, Jahresnetto zuerst
- Datenverwaltung (Sichern, Importieren, Löschen) in den Einstellungen
- Hinweise & Annahmen standardmäßig eingeklappt, Warnungen rot gezählt

### Neu
- Kurze Einführung beim ersten Besuch
- Erklärungen direkt an den Eingaben (Fragezeichen neben Stundensatz, Taggeld, Arbeitsmodell, Einsatzland, Zeitkonten)

## [2.0.0] – 2026-10-20

Vom Lohnrechner zur privaten Lohnanalyse.

### Neu
- Navigation mit eigenen Seiten: Lohnrechner, Jahresübersicht, Abrechnungen, Einstellungen (Zahnrad) und Hilfe; am Handy als Leiste unten
- Ergebnisübersicht oben: Brutto, Netto (geschätzt), Abzüge und steuerfreie Bestandteile
- Jahresübersicht mit Jahreskennzahlen, Netto je Monat, Zeitkonten-Verlauf und Monatstabelle; fehlende Monate zählen nicht als 0 €, Schätzungen sind gekennzeichnet
- Soll-Ist-Vergleich des Lohnzettels je Lohnart, Auswertung nach Bereichen mit möglichen Ursachen und Markierung „geklärt“
- Abrechnungen mit Status (offen, gespeichert, abgerechnet, geändert, veraltet), Monatsvergleich und bewusster Neuberechnung mit Verlauf
- Automatisches Speichern und Wiederherstellen nach Browser-Neustart; Zeitkonten werden in den Folgemonat übertragen
- Tagesdetails im Kalender: Normalarbeitszeit, Zuschläge und Auswirkung auf die Zeitkonten
- Arbeitsmodelle fortlaufend über Monatsgrenzen, eigene Modelle speichern, Standardmodell, früheren Monat als Vorlage
- Hinweise und Annahmen: Warnungen bei über 12 h am Tag, über 60 h pro Woche, vollem ZA-Topf, fehlendem Taggeld und nicht unterstützten Sonderfällen
- Export als CSV und PDF für Monat und Jahr, Gesamtsicherung als Datei, vollständiges Löschen mit doppelter Bestätigung
- Steuer- und SV-Werte je Gültigkeitsjahr (2025 und 2026)
- Zulagen- und Zuschlagssätze in den erweiterten Einstellungen

### Geändert
- Montage im Ausland: Es zählen nur noch die Feiertage des Einsatzlandes, nicht mehr zusätzlich die österreichischen
- Kalender: Tagesarten mit gedämpften Farben und Kürzeln, Zuschlagstage mit Markierung
- Einstellungen als eigene Seite; selten benötigte Optionen eingeklappt
- Rechenkern von der Oberfläche getrennt; Berechnungen 2026 per Referenztest gegen v1.1 abgesichert
- Datensätze der Vorversion werden automatisch übernommen

## [1.1.0] – 2026-10-16

### Geändert
- Gestaltung nach dem PRH Design Kit: Kopfzeile mit Signatur, Hero, Panels, Anleitung und Fußzeile
- Heller Modus als Standard, dunkler Modus automatisch nach Systemeinstellung
- Farben ausschließlich Schwarz/Weiß mit Dunkelrot als einzigem Akzent
- Bessere Darstellung auf dem Handy

## [1.0.0] – 2026-10-16

Erste Version.

### Funktionen
- Kalender mit Büro, Homeoffice, Einsatz, Einsatz mit Reise, Zeitausgleich und Ruhezeit
- Arbeitsmodelle 5/2, 10/4, 6/1/4/3 und eigenes Modell
- ZA-Topf mit Maximum und Überlauf, Ruhezeit-Topf aus Sonntagsarbeit
- Feiertage für Österreich und bei Auslandseinsätzen für DE (je Bundesland), CH, FR, IT, NL, BE, LU, ES
- Netto-Schätzung nach den Werten 2026: Sozialversicherung mit Höchstbeitragsgrundlage, Lohnsteuer-Tarif 2026, §68-Grenzen, Taggeld je Land, Sonderzahlungen nach §67
- Lehrlings-Modus mit reduziertem SV-Satz
- Stundensatz automatisch als Grundgehalt ÷ 143
- Datensätze speichern, laden, exportieren und importieren
- Einstellungen mit Standard-Stunden je Tagesart, optional fest in der Datei gespeichert

### Qualität
- Rechen-Tests und statische Prüfungen über GitHub Actions

[1.1.0]: https://github.com/paul-rafael/einsatzrechner/releases/tag/v1.1.0
[1.0.0]: https://github.com/paul-rafael/einsatzrechner/releases/tag/v1.0.0
