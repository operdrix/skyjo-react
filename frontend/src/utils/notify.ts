type NotifyType = "join" | "error" | "warning" | "play" | "turnCard" | "end";

function isMobileDevice() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

function vibrate() {
  if ("vibrate" in navigator) {
    navigator.vibrate([300, 30, 200]); // Vibration longue, pause, vibration courte
  }
}

function playSound(notificationType: NotifyType) {
  let beepAudio;
  if (notificationType === "play") {
    beepAudio = new Audio("/sounds/play.wav");
  } else if (notificationType === "join") {
    beepAudio = new Audio("/sounds/join.wav");
  } else if (notificationType === "turnCard") {
    beepAudio = new Audio("/sounds/turnCard.wav");
  } else if (notificationType === "warning") {
    beepAudio = new Audio("/sounds/warning.wav");
  } else if (notificationType === "end") {
    beepAudio = new Audio("/sounds/end.wav");
  } else {
    beepAudio = new Audio("/sounds/error.wav");
  }

  beepAudio.play().catch(() => {
    // Lecture bloquée par le navigateur (pas encore d'interaction) : on ignore
  });
}

function notify(notificationType: NotifyType, silence = false) {
  if (!silence) playSound(notificationType);

  if (isMobileDevice() && notificationType === "play" && !silence) vibrate();
}

export default notify;
