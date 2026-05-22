// ===================================================
// 1. On récupère les éléments HTML qu'on va manipuler
// ===================================================
const video  = document.getElementById('camera');
const status = document.getElementById('status');
const info   = document.getElementById('info');

// ===================================================
// 2. On crée l'objet "Hands" de MediaPipe.
// ===================================================
const hands = new Hands({
  locateFile: (file) =>
    https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}
});

// ===================================================
// 3. Configuration MediaPipe
// ===================================================
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5
});

// À chaque image analysée
hands.onResults(onResults);

// ===================================================
// 4. Activation de la webcam
// ===================================================
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();

// ===================================================
// 5. Fonction distance entre deux points
// ===================================================
function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ===================================================
// 6. Détection main ouverte
// ===================================================
function isHandOpen(landmarks) {

  const wrist = landmarks[0];

  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];

  let extended = 0;

  for (let i = 0; i < tips.length; i++) {

    if (
      distance(landmarks[tips[i]], wrist) >
      distance(landmarks[pips[i]], wrist)
    ) {
      extended++;
    }
  }

  return extended >= 3;
}

// ===================================================
// 7. Détection pouce + index fermés
// ===================================================
function isThumbAndIndexClosed(landmarks) {

  const wrist = landmarks[0];

  // index plié
  const indexFolded =
    distance(landmarks[8], wrist) <
    distance(landmarks[6], wrist);

  // taille paume
  const palmSize =
    distance(landmarks[0], landmarks[5]);

  // pouce plié
  const thumbFolded =
    distance(landmarks[4], landmarks[5]) <
    palmSize * 0.6;

  return indexFolded && thumbFolded;
}

// ===================================================
// 8. Détection du geste 👍
// ===================================================
function isThumbUp(landmarks) {

  // Pouce vers le haut
  const thumbUp =
    landmarks[4].y < landmarks[3].y;

  // Autres doigts repliés
  const fingersFolded =
    landmarks[8].y  > landmarks[6].y &&
    landmarks[12].y > landmarks[10].y &&
    landmarks[16].y > landmarks[14].y &&
    landmarks[20].y > landmarks[18].y;

  return thumbUp && fingersFolded;
}

// ===================================================
// 9. Gestion des résultats MediaPipe
// ===================================================
function onResults(results) {

  // ===============================================
  // Aucune main détectée
  // ===============================================
  if (
    !results.multiHandLandmarks ||
    results.multiHandLandmarks.length === 0
  ) {
    status.textContent = '🙈 Aucune main';
    return;
  }

  const landmarks = results.multiHandLandmarks[0];

  // ===============================================
  // 👍 Pouce levé → fermer le navigateur
  // ===============================================
  if (isThumbUp(landmarks)) {

    status.textContent = '👍 Fermeture du navigateur...';

    // tentative fermeture
    window.open('', '_self');
    window.close();

    return;
  }

  // ===============================================
  // ✋ Main ouverte → afficher info
  // ===============================================
  if (isHandOpen(landmarks)) {

    info.style.display = 'flex';

  } else {

    info.style.display = 'none';
  }

  // ===============================================
  // 🤏 Scroll avec pouce + index fermés
  // ===============================================
  if (isThumbAndIndexClosed(landmarks)) {

    const y = landmarks[0].y;

    // main en haut
    if (y < 0.4) {

      status.textContent = '🤏⬆️ Scroll haut';

      window.scrollBy({
        top: -20,
        behavior: 'auto'
      });

    }

    // main en bas
    else if (y > 0.6) {

      status.textContent = '🤏⬇️ Scroll bas';

      window.scrollBy({
        top: 20,
        behavior: 'auto'
      });

    }

    // zone morte
    else {

      status.textContent =
        '🤏 Pouce + index fermés (zone morte)';
    }

  }

  // ===============================================
  // ✋ Main ouverte
  // ===============================================
  else if (isHandOpen(landmarks)) {

    status.textContent = '✋ Main ouverte';
  }

  // ===============================================
  // ✊ Main fermée
  // ===============================================
  else {

    status.textContent = '✊ Main fermée';
  }
}