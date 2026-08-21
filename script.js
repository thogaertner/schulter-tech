const launchDate = new Date("2026-08-28T15:00:00+02:00");

const countdownElements = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

function updateCountdown() {
  const remaining = Math.max(0, launchDate.getTime() - Date.now());
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

  if (remaining === 0) {
    document.querySelector("#arrival-message").hidden = false;
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);
