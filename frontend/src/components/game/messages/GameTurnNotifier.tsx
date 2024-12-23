import React, { useEffect } from 'react';

function GameTurnNotifier({ isCurrentTurn }: { isCurrentTurn: boolean }) {

  function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  function vibrate() {
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate) {
      // La durée en millisecondes, ex. 200ms
      navigator.vibrate(200);
    }
  }
  function playSound() {
    const beepAudio = new Audio('/sounds/beep.wav');
    // Chemin vers ton petit son
    beepAudio.play().catch(err => {
      console.error('Impossible de jouer le son :', err);
    });
  }
  const notifyUserTurn = React.useCallback(() => {
    console.log('C\'est à vous de jouer !');
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

export default GameTurnNotifier;