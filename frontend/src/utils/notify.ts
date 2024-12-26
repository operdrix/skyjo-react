type NotifyType = 'join' | 'error' | 'warning' | 'play' | 'turnCard' | 'end';

function isMobileDevice() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

function vibrate() {
  if ("vibrate" in navigator) {
    // La durée en millisecondes, ex. 200ms
    navigator.vibrate([300, 30, 200]); // Vibration longue, pause, vibration courte
  }
}

function playSound(notificationType: NotifyType) {
  let beepAudio;
  if (notificationType === 'play') {
    beepAudio = new Audio('/sounds/play.wav');
  } else if (notificationType === 'join') {
    beepAudio = new Audio('/sounds/join.wav');
  } else if (notificationType === 'turnCard') {
    beepAudio = new Audio('/sounds/turnCard.wav');
  } else if (notificationType === 'warning') {
    beepAudio = new Audio('/sounds/warning.wav');
  } else if (notificationType === 'end') {
    beepAudio = new Audio('/sounds/end.wav');
  } else {
    beepAudio = new Audio('/sounds/error.wav');
  }
  // Chemin vers ton petit son
  beepAudio.play().catch(err => {
    console.error('Impossible de jouer le son :', err);
  });
}

function notify(notificationType: NotifyType, silence = false) {
  console.log('Beep beep !', notificationType);
  if (!silence) playSound(notificationType);

  if (isMobileDevice()) vibrate();
}

export default notify;