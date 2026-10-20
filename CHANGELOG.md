# Changelog

Alle wichtigen Änderungen an diesem Projekt. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Geändert
- Montage im Ausland: Es zählen nur noch die Feiertage des Einsatzlandes, nicht mehr zusätzlich die österreichischen

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
