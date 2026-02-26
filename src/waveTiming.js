function wavePeriodMs(matches) {
  const m = Math.max(1, matches | 0);
  const baseWpm = 60000 / 700;
  const slope = 8.571;
  const wpm = baseWpm + slope * (m - 1);
  return 60000 / wpm;
}

function applyWaveTimingToOverlay(overlay, matches) {
  if (!overlay) return;

  const period = matches > 0 ? wavePeriodMs(matches) : 700;
  const half = period / 2;

  overlay.querySelectorAll(".ssf-hand").forEach((hand) => {
    hand.style.animationDuration = `${period}ms`;
  });

  const right = overlay.querySelector(".ssf-right");
  if (right) right.style.animationDelay = `${half}ms`;
}

window.applyWaveTimingToOverlay = applyWaveTimingToOverlay; // Expose globally for content.js to call after scanning