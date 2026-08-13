# Schulter.tech – Hochzeits-Karma

Eine statische, responsive One-Page-Website für die Hochzeit am **21. August 2027 um 10:00 Uhr**.

## Funktionen

- Live-Countdown bis zur Hochzeit
- Bildschirmfüllende Abschnitte für Start und Einführung
- Filterbare Aufgaben mit den automatisch berechneten Zuständen „Offen“ und „Fertig“
- Fortschrittsanzeige pro Aufgabe mit aktuellem und benötigtem Zähler
- Karma-Fortschrittsanzeigen im Countdown und Footer mit Abzügen und einem Ziel von 1.000 Punkten
- Aufgaben und offizieller Fortschritt aus der Datei `tasks.csv`
- Karma-Abzüge und Joker aus der Datei `bad_karma.csv`
- Keine Fortschrittsänderung durch Besucherinnen und Besucher der Website
- Responsives Layout und barrierearme Bedienung

## Lokal ansehen

Da die Aufgaben per `fetch` aus der CSV geladen werden, muss die Seite über einen kleinen lokalen Webserver geöffnet werden:

```powershell
python -m http.server 8000
```

Danach ist die Website unter `http://localhost:8000` erreichbar.

Die `index.html` kann für eine schnelle Vorschau auch direkt geöffnet werden. Wegen der Sicherheitsregeln für lokale Dateien verwendet die Seite in diesem Fall eine eingebaute Vorschau der CSV-Daten. Für die verbindliche Prüfung der aktuellen `tasks.csv` sollte immer der lokale Webserver verwendet werden. Auf GitHub Pages wird grundsätzlich die echte CSV geladen.

## Inhalte anpassen

- Datum und Uhrzeit: `weddingDate` in `script.js`
- Aufgaben, Punkte und Fortschritt: `tasks.csv`
- Verstöße, Karma-Abzüge und Joker: `bad_karma.csv`
- Punkte-Ziel: `targetKarma` in `script.js`
- Farben und Typografie: Variablen am Anfang von `style.css`

Die CSV verwendet Semikolon als Trennzeichen und besitzt folgende Spalten:

```text
id;titel;beschreibung;punkte;number completed;Counts;symbol
```

Jede Aufgabe benötigt eine eindeutige ID, einen ganzzahligen Punktewert sowie zwei nicht negative Zähler. `number completed` gibt an, wie oft die Aufgabe bereits erledigt wurde; `Counts` enthält die benötigte Anzahl. Solange der erste Wert kleiner als der zweite ist, lautet der Status „Offen“. Sobald der Zielwert erreicht ist, lautet er „Fertig“ und die Karma-Punkte werden gutgeschrieben. Der Fortschritt wird direkt in `tasks.csv` gepflegt und anschließend zu GitHub übertragen. So können ausschließlich Personen mit Schreibzugriff auf das Repository den offiziellen Stand verändern.

Die Datei `bad_karma.csv` verwendet folgende Spalten:

```text
id;titel;beschreibung;punkte;counts;joker;symbol
```

`counts` enthält die Anzahl der registrierten Verstöße. Jeder Eintrag verbraucht zunächst einen der in `joker` hinterlegten Joker. Erst wenn diese aufgebraucht sind, wird für jeden weiteren Verstoß der Wert aus `punkte` vom gesammelten Karma abgezogen. Die Website zeigt den Jokerverbrauch je Eintrag sowie als Gesamtsumme an.

## Veröffentlichung mit GitHub Pages

1. Das Repository zu GitHub übertragen.
2. Unter **Settings → Pages** als Quelle **Deploy from a branch** auswählen.
3. Den Branch `main` und den Ordner `/ (root)` auswählen.
4. Unter **Custom domain** `schulter.tech` eintragen und HTTPS aktivieren.
5. Beim DNS-Anbieter die von GitHub dokumentierten DNS-Einträge für die Domain setzen.

Die Datei `CNAME` ist bereits enthalten und verbindet das Pages-Projekt mit `schulter.tech`.

## Technischer Aufbau

Die Website besteht nur aus HTML, CSS und JavaScript. Es gibt keine externen Laufzeitabhängigkeiten außer den über Google Fonts geladenen Schriften.
