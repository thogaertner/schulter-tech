const weddingDate = new Date("2027-08-21T10:00:00+02:00");
const targetKarma = 1000;
const statusLabels = {
  open: "Offen",
  completed: "Fertig",
};

// Lokale Vorschau: Bei file:// blockieren Browser den Zugriff auf tasks.csv.
// GitHub Pages und lokale Webserver laden weiterhin immer die echte CSV-Datei.
const localPreviewCsv = `id;titel;beschreibung;punkte;number completed;Counts;symbol
bandprobe;Die Band!;Organisiere eine Roundback-Reunion-Probe. Dabei müssen 4 Mitglieder der Band anwesend sein und ein Gastmusiker muss bei mindestens einem Lied mitspielen. Ein Lied von Mumford & Sons muss gespielt werden.;150;0;1;🎸
bandprobe-motivator;Die Band! (+);Du kannst zusätzliches Karma bekommen, wenn du deine Fähigkeiten als Motivator unter Beweis stellst. Wenn mehr als die Hälfte übt, bekommst du etwas mehr Karma gutgeschrieben.;100;0;1;🎸
lieblingsessen;Fine-Dining;Koche für A.K. ein 3-Gänge-Menü, auf Wunsch auch mit Weinbegleitung. Das Handy bleibt während des gesamten Essens allerdings aus.;100;0;1;🍽
verwoehnung;Verwöhne;Mache Benni vor mindestens 3 unabhängigen Zeugen 5 ernst gemeinte Komplimente. Fasse ihn dabei an beiden Händen und schaue ihm tief in die Augen.;100;1;5;🤝
konzert;Konzertreihe;Gehe mit 5 verschiedenen Personen in 5 verschiedenen Städten auf 5 verschiedene Konzerte.;150;1;5;🎤
jack-elwood;Jack & Elwood;Organisiere einen Filmabend, bei dem ihr den Film „Blues Brothers“ schaut. Eine Person davon darf den Film allerdings noch nie gesehen haben. Niemand darf einschlafen und der Filmabend darf nicht vor 20 Uhr anfangen!;100;0;1;🕶
bibelkenner;Bibelkenner (1/2);Zitiere bei einem Besuch bei deinen Schwiegereltern dreimal aus der Bibel. Die Zitate zählen nur, wenn A.K. dabei nicht lachen muss.;50;0;3;📖
bibelkenner2;Bibelkenner (2/2);Zitiere bei einem Besuch bei deiner Schwiegeroma dreimal aus der Bibel. Die Zitate zählen nur, wenn A.K. dabei nicht lachen muss.;100;0;3;📖
bmw;Konkurrenzkampf!;Mache unter Zeugen gegenüber Hannes mindestens 3 positive Bemerkungen zu BMW-Innovationen aus den letzten 5 Jahren. Dabei muss mindestens einmal der Satz „Da haben sie gegenüber Toyota schon die Nase vorn.“ fallen.;100;0;3;🚗
nd;9dorf-Dynamics (1/2);Liefere mindestens ein fertiges Produkt aus (ausgenommen den Corolla, versteht sich). Das Produkt muss bei einer Produktpräsentation im Stil von Steve Jobs mindestens 3 Personen vorgestellt werden.;100;0;1;🛠️
oppenheimer;Oppenheimer (2/2);Handelt es sich bei dem gelieferten Produkt um eine funktionierende Kartoffelkanone? Das gibt Extrapunkte, sofern sich bei der Vorführung niemand verletzt!;50;0;1;🛠️
forrest-gump;Lauf, Forrest, lauf!;Gehe mit A.K. mindestens 15 km und 300 Höhenmeter wandern. Dabei darf weder davor noch währenddessen noch danach eine einzige Beschwerde fallen.;100;0;1;🥾
`

const localPreviewBadKarmaCsv = `id;titel;beschreibung;punkte;counts;joker;symbol
response;Geghostet;Du hast vergessen, deinen Freunden innerhalb von 48 Stunden auf eine Nachricht zu antworten? Oh, oh – das gibt 5 Punkte Abzug.;5;0;3;👻
toolate;Zu spät;Du bist nicht zur vereinbarten Zeit bei einer Verabredung und hast nicht mindestens 30 Minuten vorher Bescheid gesagt? Das gibt leider pro Minute einen Punkt Abzug.;1;0;10;⏰
handyfrei;Handyfreie Zeit;A.K. hat die Macht, einmal pro Tag 30 Minuten handyfreie Zeit einzuberufen. Für jeden Blick auf das Handy gehen 5 Karma-Punkte verloren.;5;0;3;📵
`;

const countdownElements = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

function updateCountdown() {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  const values = {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };

  countdownElements.days.textContent = String(values.days).padStart(3, "0");
  countdownElements.hours.textContent = String(values.hours).padStart(2, "0");
  countdownElements.minutes.textContent = String(values.minutes).padStart(2, "0");
  countdownElements.seconds.textContent = String(values.seconds).padStart(2, "0");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ";" && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = rows.shift()?.map((header) => header.replace(/^\uFEFF/, "")) || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeTasks(rows) {
  return rows.flatMap((row, index) => {
    const points = Number.parseInt(row.punkte, 10);
    const numberCompleted = Number.parseInt(row["number completed"], 10);
    const count = Number.parseInt(row.Counts, 10);
    const hasValidCounts = Number.isInteger(numberCompleted) && numberCompleted >= 0 && Number.isInteger(count) && count > 0;

    if (!row.id || !row.titel || !Number.isFinite(points) || !hasValidCounts) {
      console.warn(`Ungültige Aufgabe in CSV-Zeile ${index + 2} wurde übersprungen.`, row);
      return [];
    }
    const status = numberCompleted >= count ? "completed" : "open";
    return [{ ...row, points, numberCompleted, count, status }];
  });
}

function normalizeBadKarma(rows) {
  return rows.flatMap((row, index) => {
    const points = Number.parseInt(row.punkte, 10);
    const counts = Number.parseInt(row.counts, 10);
    const joker = Number.parseInt(row.joker, 10);
    const hasValidValues = Number.isInteger(points) && points > 0
      && Number.isInteger(counts) && counts >= 0
      && Number.isInteger(joker) && joker >= 0;

    if (!row.id || !row.titel || !hasValidValues) {
      console.warn(`Ungültiger Karma-Abzug in CSV-Zeile ${index + 2} wurde übersprungen.`, row);
      return [];
    }

    const jokerUsed = Math.min(counts, joker);
    const uncoveredCounts = Math.max(0, counts - joker);
    const deduction = uncoveredCounts * points;
    const state = deduction > 0 ? "penalty" : jokerUsed > 0 ? "protected" : "clear";

    return [{ ...row, points, counts, joker, jokerUsed, uncoveredCounts, deduction, state }];
  });
}

function renderTasks(tasks) {
  document.querySelector("#task-list").innerHTML = tasks
    .map((task) => {
      const taskPercent = Math.min(100, (task.numberCompleted / task.count) * 100);

      return `
        <article class="task-card" data-task-id="${escapeHtml(task.id)}" data-status="${task.status}" data-points="${task.points}">
          <div class="task-meta">
            <span class="status">${statusLabels[task.status]}</span>
            <span class="points">+${task.points.toLocaleString("de-DE")} Karma</span>
          </div>
          <span class="task-icon" aria-hidden="true">${escapeHtml(task.symbol || "✦")}</span>
          <h3>${escapeHtml(task.titel)}</h3>
          <p>${escapeHtml(task.beschreibung)}</p>
          <div class="task-progress-copy">
            <span>Fortschritt</span>
            <strong>${task.numberCompleted.toLocaleString("de-DE")} von ${task.count.toLocaleString("de-DE")}</strong>
          </div>
          <div
            class="task-progress-track"
            role="progressbar"
            aria-label="Fortschritt: ${escapeHtml(task.titel)}"
            aria-valuemin="0"
            aria-valuemax="${task.count}"
            aria-valuenow="${Math.min(task.numberCompleted, task.count)}"
          >
            <div class="task-progress-fill" style="width: ${taskPercent}%"></div>
          </div>
          <p class="task-source">Fortschritt wird über das Trauzeugenteam gepflegt</p>
        </article>`;
    })
    .join("");
}

function renderBadKarma(entries) {
  const stateLabels = {
    clear: "Ohne Verstoß",
    protected: "Joker genutzt",
    penalty: "Abzug aktiv",
  };

  document.querySelector("#bad-karma-list").innerHTML = entries
    .map((entry) => {
      const jokerPercent = entry.joker > 0 ? Math.min(100, (entry.jokerUsed / entry.joker) * 100) : 0;

      return `
        <article class="task-card bad-karma-card" data-bad-karma-id="${escapeHtml(entry.id)}" data-state="${entry.state}">
          <div class="task-meta">
            <span class="status">${stateLabels[entry.state]}</span>
            <span class="points">−${entry.points.toLocaleString("de-DE")} Karma je Verstoß</span>
          </div>
          <span class="task-icon" aria-hidden="true">${escapeHtml(entry.symbol || "−")}</span>
          <h3>${escapeHtml(entry.titel)}</h3>
          <p>${escapeHtml(entry.beschreibung)}</p>
          <div class="task-progress-copy">
            <span>Joker verbraucht</span>
            <strong>${entry.jokerUsed.toLocaleString("de-DE")} von ${entry.joker.toLocaleString("de-DE")}</strong>
          </div>
          <div
            class="task-progress-track"
            role="progressbar"
            aria-label="Verbrauchte Joker: ${escapeHtml(entry.titel)}"
            aria-valuemin="0"
            aria-valuemax="${Math.max(1, entry.joker)}"
            aria-valuenow="${entry.jokerUsed}"
          >
            <div class="task-progress-fill" style="width: ${jokerPercent}%"></div>
          </div>
          <div class="bad-karma-details">
            <div class="bad-karma-detail"><span>Verstöße</span><strong>${entry.counts.toLocaleString("de-DE")}</strong></div>
            <div class="bad-karma-detail"><span>Davon nicht geschützt</span><strong>${entry.uncoveredCounts.toLocaleString("de-DE")}</strong></div>
            <div class="bad-karma-detail"><span>Aktueller Abzug</span><strong>−${entry.deduction.toLocaleString("de-DE")} Karma</strong></div>
          </div>
          <p class="task-source">Verstöße und Joker werden über das Trauzeugenteam gepflegt</p>
        </article>`;
    })
    .join("");
}

function updateJokerSummary(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.joker, 0);
  const used = entries.reduce((sum, entry) => sum + entry.jokerUsed, 0);
  const remaining = total - used;

  document.querySelector("#joker-used").textContent = used.toLocaleString("de-DE");
  document.querySelector("#joker-total").textContent = total.toLocaleString("de-DE");
  document.querySelector("#joker-remaining").textContent = remaining === 1
    ? "Noch 1 Joker übrig."
    : `Noch ${remaining.toLocaleString("de-DE")} Joker übrig.`;
}

function updateKarma(tasks, badKarmaEntries) {
  const earned = tasks
    .filter((task) => task.status === "completed")
    .reduce((total, task) => total + task.points, 0);
  const deducted = badKarmaEntries.reduce((total, entry) => total + entry.deduction, 0);
  const current = earned - deducted;
  const percent = Math.max(0, Math.min(100, (current / targetKarma) * 100));
  const remaining = Math.max(0, targetKarma - current);
  const progress = document.querySelector(".progress-track");
  const heroProgress = document.querySelector(".hero-karma-track");
  const currentLabel = current.toLocaleString("de-DE");
  const breakdownLabel =
    `${earned.toLocaleString("de-DE")} gesammelt · ${deducted.toLocaleString("de-DE")} abgezogen`;

  document.querySelector("#karma-current").textContent = currentLabel;
  document.querySelector("#hero-karma-current").textContent = currentLabel;
  document.querySelector("#karma-progress").style.width = `${percent}%`;
  document.querySelector("#hero-karma-progress").style.width = `${percent}%`;
  document.querySelector("#hero-karma-balance").textContent = breakdownLabel;
  document.querySelector("#karma-remaining").textContent = remaining
    ? `Noch ${remaining.toLocaleString("de-DE")} Punkte bis zum Ziel.`
    : "Geschafft - 1.000 Karma-Punkte gesammelt!";
  document.querySelector("#karma-breakdown").textContent =
    `${earned.toLocaleString("de-DE")} Karma gesammelt · ${deducted.toLocaleString("de-DE")} Karma abgezogen`;
  const accessibleCurrent = String(Math.max(0, Math.min(targetKarma, current)));
  progress.setAttribute("aria-valuenow", accessibleCurrent);
  heroProgress.setAttribute("aria-valuenow", accessibleCurrent);
}

function setupFilters() {
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".filter.is-active")?.classList.remove("is-active");
      button.classList.add("is-active");
      document.querySelectorAll("#task-list .task-card").forEach((card) => {
        card.hidden = button.dataset.filter !== "all" && card.dataset.status !== button.dataset.filter;
      });
    });
  });
}

async function loadCsv(filename, localPreview) {
  if (window.location.protocol === "file:") return localPreview;

  const csvUrl = new URL(filename, window.location.href);
  const response = await fetch(csvUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
  return response.text();
}

async function loadKarmaData() {
  try {
    const [tasksCsvText, badKarmaCsvText] = await Promise.all([
      loadCsv("tasks.csv", localPreviewCsv),
      loadCsv("bad_karma.csv", localPreviewBadKarmaCsv),
    ]);

    const tasks = normalizeTasks(parseCsv(tasksCsvText));
    const badKarmaEntries = normalizeBadKarma(parseCsv(badKarmaCsvText));
    if (!tasks.length) throw new Error("Die CSV enthält keine gültigen Aufgaben.");
    if (!badKarmaEntries.length) throw new Error("Die CSV enthält keine gültigen Karma-Abzüge.");

    renderTasks(tasks);
    renderBadKarma(badKarmaEntries);
    updateJokerSummary(badKarmaEntries);
    updateKarma(tasks, badKarmaEntries);
  } catch (error) {
    console.error("Karma-Daten konnten nicht geladen werden:", error);
    document.querySelector("#task-list").innerHTML =
      '<p class="task-message">Die Aufgaben konnten gerade nicht geladen werden. Bitte versuche es später erneut.</p>';
    document.querySelector("#bad-karma-list").innerHTML =
      '<p class="task-message">Die Karma-Abzüge konnten gerade nicht geladen werden. Bitte versuche es später erneut.</p>';
    document.querySelector("#hero-karma-balance").textContent = "Karma-Daten konnten nicht geladen werden.";
  }
}

setupFilters();
loadKarmaData();
updateCountdown();
setInterval(updateCountdown, 1000);
