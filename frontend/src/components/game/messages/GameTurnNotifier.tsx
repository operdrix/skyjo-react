import React, { useEffect } from 'react';

function GameTurnNotifier_old({ isCurrentTurn }: { isCurrentTurn: boolean }) {

  function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  function vibrate() {
    if ("vibrate" in navigator) {
      // La durée en millisecondes, ex. 200ms
      navigator.vibrate([300, 30, 200]); // Vibration longue, pause, vibration courte
    }
  }
  function playSound() {
    const beepAudio = new Audio('/sounds/notif.wav');
    // Chemin vers ton petit son
    beepAudio.play().catch(() => {
    // Lecture bloquée par le navigateur (pas encore d'interaction) : on ignore
  });
  }
  const notifyUserTurn = React.useCallback(() => {
    playSound();

    if (isMobileDevice()) {
      vibrate();
    } else {
      playSound();
    }
  }, []);

  useEffect(() => {
    if (isCurrentTurn) {
      notifyUserTurn();
    }
  }, [isCurrentTurn, notifyUserTurn]);

  return null; // Pas d'affichage, on s'occupe juste de la notif
}

export default GameTurnNotifier_old;