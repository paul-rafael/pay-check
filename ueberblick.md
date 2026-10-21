# Einsatzrechner – Funktionsüberblick

Stand: Version 2.2.1 · Live: <https://paul-rafael.github.io/einsatzrechner/>

Einsätze erfassen, Lohn nachrechnen, Lohnzettel prüfen – nach österreichischem Recht, vollständig im Browser, ohne Konto und ohne Server.

---

## Aufbau

| Bereich | Inhalt |
| --- | --- |
| **Erfassen** | Monat wählen, Arbeitskalender, Bezahlung, Zeitkonten, Hinweise |
| **Ergebnis** | Lohnzettel (berechnet), Brutto-Netto-Rechnung, Soll-Ist-Vergleich, Lohnzettel einlesen, Stundenübersicht |
| **Gespeicherte Monate** | Jahresübersicht, alle Monate mit Status, Monatsvergleich |
| **Einstellungen** | Standardwerte, Arbeitsmodelle, Zeitkonten, Steuerjahr, Zulagensätze, Daten, Darstellung |
| **Hilfe** (Fragezeichen oben) | Anleitung, Status-Erklärung, Feiertage & Taggeld-Sätze, was nicht berücksichtigt wird |

Am Handy gibt es eine Navigationsleiste unten. Alte Adressen (`#rechner`, `#jahr`, `#abrechnungen`) leiten weiter.

---

## Ergebnisleiste (Erfassen und Ergebnis)

- **Netto geschätzt** als größte Zahl, daneben Brutto und Abzüge (SV und Lohnsteuer)
- **davon steuerfrei**, aufgeschlüsselt nach Taggeld, §68-Zuschlägen, Pauschalen und Prämien
- Kurzinfos: Stunden, ZA-Saldo, Ruhezeit, Montage-Tage, Steuerjahr, Anzahl der Warnungen
- Ist ein Lohnzettel verglichen, steht das echte Netto samt Differenz darunter
- Am Handy bleibt das Netto beim Scrollen in einer schmalen Leiste sichtbar

---

## Erfassen

### Monat und Status
- Monat und Jahr wählen, mit Pfeilen blättern
- Eingaben werden **automatisch gespeichert** und nach einem Browser-Neustart wiederhergestellt
- Leere, nur angesehene Monate werden nicht gespeichert
- Menü „…“: als abgerechnet markieren, früheren Monat als Vorlage, Arbeitsmodell fortführen, PDF/CSV/JSON-Export, alle Kalendereinträge löschen

### Arbeitskalender
- **Tagesarten** mit Farbe und Kürzel: Büro (B), Homeoffice (HO), Montage (M), Montage + Reise (M+R), Zeitausgleich (ZA), Ruhezeit (RZ), frei
- Tag anklicken: Tagesart, Stunden, Reisezeit, Einsatzland/Bundesland, 10/4-Wochenendtausch
- **Tagesdetails**: Normalarbeitszeit, ZA- und Ruhezeit-Auswirkung, Zuschläge, Grundvergütung, On-Site, Lenkzeit, Taggeld
- Tage kopieren und auf beliebige Tage einfügen
- Heutiger Tag, ausgewählter Tag, Wochenenden und Feiertage sind hervorgehoben; Sa/So/Feiertag mit Zuschlag tragen einen roten Punkt

### Arbeitsmodelle
- 5/2, 10/4, 6/1/4/3, „Eigenes x/y“ und frei definierte eigene Modelle (z. B. `12/2`, `6/1/4/3`)
- Einmal setzen (ein Durchgang) oder **fortlaufend** bis Monatsende – der Rhythmus wird in Folgemonaten fortgeführt
- Optionen: Stunden pro Tag, erster/letzter Tag als Reisetag, freie Werktage als ZA
- Vorhandene Einträge werden nur nach Rückfrage überschrieben
- **Früheren Monat als Vorlage**: Wochenmuster, Grunddaten und Prämien übernehmen

### Einsatzland und Feiertage
- Österreich, Deutschland (je Bundesland), Schweiz, Frankreich, Italien, Niederlande, Belgien, Luxemburg, Spanien
- Österreichische Feiertage; an **Montage-Tagen im Ausland nur die Feiertage des Einsatzlandes**
- Land auf alle Montage-Tage des Monats anwenden (mit Rückfrage)

### Bezahlung
- Grundgehalt, Stundensatz (Grundgehalt ÷ Stundenteiler), Taggeld, „Lohnzettel für“ (Folgemonat)
- Lehrlings-Schalter (reduzierter SV-Satz)
- Einklappbar: Urlaubsgeld und Prämien/Zulagen (steuerpflichtig, steuerfrei oder §67 begünstigt)
- Fragezeichen-Erklärungen direkt an den Feldern

### Zeitkonten
- **ZA-Topf**: Start, Zugänge, Entnahmen, Ende; Maximum mit Auszahlung des Überlaufs
- **Ruhezeit-Topf**: Sonntagsstunden 1:1; ZA- und Ruhezeit-Tage leeren zuerst diesen Topf
- Endstände werden **automatisch in den Folgemonat übertragen**; bei Abweichung wird die Übernahme angeboten

### Hinweise & Annahmen
- **Warnungen**: über 12 h am Tag, über 60 h pro Woche, ZA-Maximum erreicht, negativer ZA-Saldo, Montage ohne Taggeld, ZA/Ruhezeit an Wochenend- oder Feiertagen, fehlende Steuerwerte für das Jahr
- **Hinweise**: ZA-Topf fast voll, Ruhezeit reichte nicht, Taggeld über dem steuerfreien Satz, Deutschland ohne Bundesland, nur landesweite Feiertage (CH, ES)
- **Annahmen**: Taggeld-Voraussetzungen, Jahressechstel, Feiertagsarbeit, Lohnsteuer ohne Absetzbeträge, Stundenteiler

---

## Ergebnis

### Lohnzettel (berechnet)
- Lohnarten mit Einheiten, Satz und Betrag: 1000 Grundgehalt, 1500 Samstag, 1520 Sonntag §68/1, 1530 Feiertag/über 10 h §68/2, 1590 Grundvergütung, 1591/1592 ZA-Überlauf, 1641 On-Site-Zulage, 5040 Taggeld, 5550 Lenkzeit, 9010 Homeoffice, 8000 Urlaubsgeld, Prämien
- **Brutto → Netto**: steuerfreie Bestandteile, steuerpflichtiges Brutto, SV, Lohnsteuer, Sonderzahlungen nach §67

### Soll-Ist-Vergleich
- Ist-Beträge des echten Lohnzettels je Lohnart sowie SV, Lohnsteuer und Netto eintragen
- Weitere Positionen, die nur am Lohnzettel stehen
- Auswertung nach Bereichen (Grundgehalt, Zuschläge, Zulagen, Taggeld, Sonderzahlungen, SV, Lohnsteuer, Netto) mit Status und **möglichen Ursachen**
- Abweichungen als „geklärt“ markieren und Notizen hinterlegen
- Abweichungen sind Hinweise, kein Beleg für einen Fehler des Arbeitgebers

### Lohnzettel einlesen (Vorschau)
- **PDF, Scan oder Fotos** (ein PDF bis 5 Seiten oder bis zu 5 Fotos, zusammen bis 15 MB)
- Digitale PDFs über die Textebene, Scans und Fotos per Texterkennung (Tesseract.js, PDF.js)
- Bildaufbereitung: Begradigung, Graustufen und Kontrast, Entfernen von Tabellenlinien
- **Kontrollfenster**: jeder Wert bearbeitbar, Status erkannt / unsicher / mehrdeutig / nicht gefunden – es wird nichts geraten
- **Vergleich** Soll, Ist und Differenz je Position und für das Netto; Hinweis bei abweichendem Abrechnungsmonat
- Übernahme in den Soll-Ist-Vergleich nur auf ausdrücklichen Klick
- **Layout „Abrechnungsbeleg“** (Lohnart · Einheiten · Satz/BMG · Abzüge · Bezüge): Aufrollung aus Vormonaten (`02*` = Februar), Taggeld 5040 + 5041, Homeoffice 1060 → 9010, Summen über alle Seiten, Jahres- und Dienstgeberwerte ausgeschlossen; Summen mit Aufrollung „eingeschränkt vergleichbar“
- Andere Lohnzettel: allgemeine Zuordnung, noch nicht an echten Belegen geprüft
- Funktioniert online und über einen lokalen Webserver, nicht in der heruntergeladenen Einzeldatei

### Stundenübersicht
- Alle Tage mit Wochensummen: Gesamt, Normalarbeitszeit, ZA, Ruhezeit, Samstagszuschlag, §68/1, §68/2, Lenkzeit

---

## Gespeicherte Monate

### Jahresübersicht
- Jahresnetto, Jahresbrutto, Taggeld, Zeitkonten; SV, Lohnsteuer, steuerfrei, Zuschläge, Prämien, Stunden
- Diagramm **Netto je Monat** (gespeichert, offen als Schätzung, Netto laut Lohnzettel, nicht erfasst)
- Diagramm **Zeitkonten am Monatsende** (ZA und Ruhezeit)
- Monatstabelle; **fehlende Monate zählen nicht als 0 €**
- Export als CSV und PDF

### Alle Monate
- Status: **offen**, **gespeichert**, **abgerechnet**, **geändert** (Eingaben weichen ab), **veraltet** (Neuberechnung ergibt andere Werte)
- Gespeicherte Fassungen ändern sich nie von selbst; **Neu berechnen** nur bewusst, die alte Fassung bleibt im Verlauf
- Öffnen, abgerechnet markieren, CSV, löschen
- **Monatsvergleich**: mehrere Monate nebeneinander mit Differenz

---

## Einstellungen

- Grunddaten: Grundgehalt, Stundenteiler, Taggeld, Lehrling
- Standardstunden je Tagesart (Büro, Homeoffice, Montage, Reisetag)
- Arbeitsmodell: Standardmodell und Starttag, Optionen, eigene Modelle
- ZA-Maximum, Standard-Einsatzland
- Berechnungsannahmen: hinterlegte Werte je Steuerjahr, Toleranz für den Soll-Ist-Vergleich
- Erweitert: On-Site-Zulage, Homeoffice-Pauschale, Samstags-, Lenkzeit- und Überlauf-Zuschlag
- **Daten**: alles sichern, Sicherung oder Monat importieren, alles löschen (doppelte Bestätigung)
- Darstellung (automatisch, hell, dunkel); Einstellungen optional fest in die HTML-Datei schreiben
- Gespeicherte Monate bleiben bei Änderungen unverändert

---

## Berechnungsregeln

| Thema | Regel |
| --- | --- |
| Normalarbeitszeit | Mo–Do 8,25 h, Fr 5,5 h, Sa/So/Feiertag 0 h |
| Mehrstunden | bis 10 h pro Tag in den ZA-Topf, darüber Überstunde 100 % (§68/2) + Grundvergütung |
| 50-h-Woche | ZA-Stunden über 50 h Mo–Fr werden zu Überstunden |
| Samstag | alle Stunden Grundvergütung + 50 % |
| Sonntag | alle Stunden Grundvergütung + 100 % (§68/1), dazu 1:1 Ruhezeit |
| Feiertag | alle Stunden Grundvergütung + 100 % |
| 10/4-Tausch | Sa/So im Arbeitsblock wie ein normaler Arbeitstag, freie Tage ohne ZA-Abzug |
| Reisetag | Reisezeit zählt als Arbeitszeit ohne On-Site-Zulage; keine Minusstunden |
| Lenkzeit | Reisezeit außerhalb der Normalarbeitszeit: 50 % Zuschlag |
| ZA-Überlauf | über dem Maximum: Grundvergütung + 50 % |
| Taggeld | steuer- und SV-frei bis zum Satz des Einsatzlandes (AT 30 €, DE 35,30 €, CH 36,80 € …) |
| Homeoffice | 1 € pro Tag, steuerfrei bis 3 € |
| §68 EStG | Sonn-/Feiertag bis 400 € steuerfrei; Überstundenzuschläge 2026: 15 h, bis 170 € (2025: 18 h, 200 €) |
| SV | 18,07 % (Sonderzahlungen 17,07 %), reduzierte AV bei geringem Einkommen, Höchstbeitragsgrundlage |
| Lohnsteuer | Tarif des Jahres inkl. Verkehrsabsetzbetrag und Werbungskostenpauschale |
| Sonderzahlungen | 6 % bis zum Jahressechstel (genähert 2 × Grundgehalt), 620 € frei, Freigrenze 2.100 € |
| Steuerjahre | Werte für 2025 und 2026 hinterlegt; andere Jahre mit Ersatz und Warnung |

Nicht berücksichtigt: Pendlerpauschale, Familienbonus Plus, AVAB/AEAB, Aufrollungen, Freibetragsbescheide, Sachbezüge, Krankenstand, Gewerkschaftsbeitrag, Vorschüsse, Pfändungen, abweichende KV-Regeln.

---

## Datenschutz

- Alle Daten liegen nur im Speicher des eigenen Browsers – kein Konto, kein Server, kein Tracking
- Lohnzettel werden ausschließlich lokal gelesen; Bibliotheken, Worker und Sprachdaten kommen von der eigenen Seite (`vendor/`), es gibt keine Anfragen an Dritte
- Hochgeladene Dateien und erkannte Werte werden nicht gespeichert und nach dem Schließen verworfen
- Eine automatische Prüfung stellt sicher, dass die Lohnzettel-Module keine externen Adressen enthalten

---

## Technik und Qualität

- Eine HTML-Datei mit getrenntem Rechenkern und Oberfläche; Lohnzettel-Module in `lohnzettel/` werden nur bei Bedarf geladen
- Kein Build-Schritt; GitHub Pages liefert `main` direkt aus
- 63 automatische Tests: Referenzwerte der Berechnung, Zeitkonten, Status, Monatsübertrag, Schaltjahr, Steuerjahre, Export, Parser (Zahlenformate, negative Werte, Rundung, fehlerhafte Texterkennung, Belegstruktur)
- Statische Prüfungen: Syntax, keine persönlichen Einstellungen in der Datei, keine Emojis, keine externen Adressen, Prüfsummen der Bibliotheken
- Releases mit Download `einsatzrechner.html` über den Release-Workflow
- Browser: getestet in Chromium; für Safari wird eine fehlende Stream-Funktion für PDF.js ergänzt (in Chromium nachgestellt geprüft)
