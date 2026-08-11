const weddingDate = new Date("2027-08-21T10:00:00+02:00");
const targetKarma = 1000;
const statusLabels = {
  open: "Offen",
  completed: "Fertig",
};

// Lokale Vorschau: Bei file:// blockieren Browser den Zugriff auf tasks.csv.
// GitHub Pages und lokale Webserver laden weiterhin immer die echte CSV-Datei.
const localPreviewCsv = `id;titel;beschreibung;punkte;number completed;Counts;symbol
bandprobe;Die Band!;Organisiere eine Roundback Reunion Probe. Dabei müssen 4 Mitglieder aus der Band anwesend sein und ein Gastmusiker muss für mindestens ein Lied mit spielen. Ein Mumford&Sons Lied muss gespielt werden.;150;0;1;🎸
lieblingsessen;Fine-Dining;Koche für A.K. ein 3 Gänge Menu, falls A.K. wünscht auch mit Weinbegleitung. Das Handy bleibt beim kompletten Essen allerdings aus.;100;0;1;🍽
verwoehnung;Verwöhne;Mache Benni vor mindestens 3 unabhängigen Zeugen 5 ernstgemeinte Komplimente. Fasse ihn dabei an beide Hände und schaue ihm tief in die Augen.;100;0;1;🤝
boot;Das Boot;Fahre mit deinem Faltboot an folgende Koordinaten: 53.50616857925201, 10.254859760715112.;100;0;1;🛶
playlist;DJ-Daniel;Erstelle eine Playlist mit 10 Liebesliedern und spiele sie deiner Verlobten vor. Optional kannst du mit Taxi zum Auftritt kommen;100;0;1;🎧
konzert;Konzertreihe;Gehe mit 5 verschiedenen Personen in 5 verschiedenen Städten auf 5 verschiedene Konzerte.;150;0;5;🎤
jack-elwood;Jack & Elwood;Organisiere einen Filmabend, bei dem der Film Blues Brothers schaut. Eine Person davon darf den Film vorher allerdings noch nie gesehen haben!;150;0;1;🕶
bibelkenner;Bibelkenner;Zitiere bei einem Besuch bei deinen Schwiegereltern 3 Mal aus der Bibel. Das Zitat zählt nur, wenn A.K. dabei nicht lachen muss.;100;0;3;📖
sonntagsausflug;Sonntagsausflug;Fahre mit A.K. an einen Ort, den ihr beide miteinander verbindet, und veranstalte dort ein romantisches Picknick.;100;0;1;🧺
schwiegereltern-interview;Das große Daniel-Archiv;Erzähle A.K. drei Geschichten aus deiner Kindheit oder Jugend, die sie noch nicht kennt. Mindestens eine davon muss peinlich sein.;100;0;3;🎙`

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

function updateKarma(tasks) {
  const current = tasks
    .filter((task) => task.status === "completed")
    .reduce((total, task) => total + task.points, 0);
  const percent = Math.min(100, (current / targetKarma) * 100);
  const remaining = Math.max(0, targetKarma - current);
  const progress = document.querySelector(".progress-track");

  document.querySelector("#karma-current").textContent = current.toLocaleString("de-DE");
  document.querySelector("#karma-progress").style.width = `${percent}%`;
  document.querySelector("#karma-remaining").textContent = remaining
    ? `Noch ${remaining.toLocaleString("de-DE")} Punkte bis zum Ziel.`
    : "Geschafft - 1.000 Karma-Punkte gesammelt!";
  progress.setAttribute("aria-valuenow", String(current));
}

function setupFilters() {
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".filter.is-active")?.classList.remove("is-active");
      button.classList.add("is-active");
      document.querySelectorAll(".task-card").forEach((card) => {
        card.hidden = button.dataset.filter !== "all" && card.dataset.status !== button.dataset.filter;
      });
    });
  });
}

async function loadTasks() {
  try {
    let csvText;

    if (window.location.protocol === "file:") {
      csvText = localPreviewCsv;
    } else {
      const csvUrl = new URL("tasks.csv", window.location.href);
      const response = await fetch(csvUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      csvText = await response.text();
    }

    const tasks = normalizeTasks(parseCsv(csvText));
    if (!tasks.length) throw new Error("Die CSV enthält keine gültigen Aufgaben.");
    renderTasks(tasks);
    updateKarma(tasks);
  } catch (error) {
    console.error("Aufgaben konnten nicht geladen werden:", error);
    document.querySelector("#task-list").innerHTML =
      '<p class="task-message">Die Aufgaben konnten gerade nicht geladen werden. Bitte versuche es später erneut.</p>';
  }
}

setupFilters();
loadTasks();
updateCountdown();
setInterval(updateCountdown, 1000);
