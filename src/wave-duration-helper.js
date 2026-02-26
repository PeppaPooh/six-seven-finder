function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Period in ms: P(1)=700, P(5)=500, P(inf)->100
function wavePeriodMs(matches) {
  const P1 = 700;
  const Pmin = 100;
  const k = 0.125;

  const m = Math.max(1, matches | 0); // cheap int coercion
  const period = Pmin + (P1 - Pmin) / (1 + k * (m - 1));

  // Safety clamp (never below Pmin, never above P1)
  return clamp(period, Pmin, P1);
}

function applyWaveTiming(matches) {
  const overlay = ensureOverlay();

  // If overlay hidden / no matches, keep defaults (optional)
  const any = matches > 0;
  const period = any ? wavePeriodMs(matches) : 700;
  const half = period / 2;

  const left = overlay.querySelector(".ssf-hand.ssf-left");
  const right = overlay.querySelector(".ssf-hand.ssf-right");
  if (!left || !right) return;

  // Override style.css values inline
  left.style.animationDuration = `${period}ms`;
  left.style.animationDelay = `0ms`;

  right.style.animationDuration = `${period}ms`;
  right.style.animationDelay = `${half}ms`; // opposite phase = half-period
}