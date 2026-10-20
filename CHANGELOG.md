# Changelog

Alle wichtigen Änderungen an diesem Projekt. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

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

[1.1.0]: https://github.com/paul-rafael/gehaltspruefer/releases/tag/v1.1.0
[1.0.0]: https://github.com/paul-rafael/gehaltspruefer/releases/tag/v1.0.0
