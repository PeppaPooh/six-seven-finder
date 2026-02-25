(() => {
  const OVERLAY_ID = "ssf-overlay";
  const HIGHLIGHT_CLASS = "ssf-highlight";

  // Matches:
  // - 67 (not embedded in larger numbers)
  // - "six seven" / "six-seven"
  // - 6.7 (not embedded in larger numbers)
  // - 6-7 / 6–7 / 6—7 (not embedded in larger numbers)
  const PATTERN =
    /(?<!\d)67(?!\d)|\bsix[\s\-]+seven\b|(?<!\d)6\.7(?!\d)|(?<!\d)6[\-\u2013\u2014]7(?!\d)/gi;

  const BLOCKED_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION"
  ]);

  let disabled = false;
  let currentIndex = -1;
  let debounce;
  let observer = null;
  let isScanning = false;

  function isBlockedNode(node) {
    const el = node.parentElement;
    if (!el) return true;
    if (BLOCKED_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.closest(`#${OVERLAY_ID}`)) return true;
    if (el.closest(`.${HIGHLIGHT_CLASS}`)) return true; // avoid re-processing inside highlights
    return false;
  }

  function clearHighlights() {
    const spans = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    spans.forEach((span) => {
      span.replaceWith(document.createTextNode(span.textContent || ""));
    });
  }

  function highlightInTextNode(textNode) {
    const text = textNode.nodeValue;
    if (!text) return 0;

    // IMPORTANT: reset before any .test() / .exec() because PATTERN is global (/g)
    PATTERN.lastIndex = 0;
    if (!PATTERN.test(text)) return 0;

    PATTERN.lastIndex = 0;
    let last = 0;
    let match;
    let count = 0;

    const frag = document.createDocumentFragment();

    while ((match = PATTERN.exec(text)) !== null) {
      // Append text before match
      if (match.index > last) {
        frag.append(document.createTextNode(text.slice(last, match.index)));
      }

      // Append highlight
      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.textContent = match[0];
      frag.append(span);

      last = match.index + match[0].length;
      count++;

      // Safety for zero-length matches (not expected here, but defensive)
      if (PATTERN.lastIndex === match.index) {
        PATTERN.lastIndex++;
      }
    }

    // Append trailing text
    if (last < text.length) {
      frag.append(document.createTextNode(text.slice(last)));
    }

    textNode.replaceWith(frag);
    return count;
  }

  function walkAndHighlight(root) {
    if (!root) return 0;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          node.nodeValue?.trim() && !isBlockedNode(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    let total = 0;
    for (const textNode of textNodes) {
      // Skip if node was detached by prior replacements
      if (!textNode.isConnected) continue;
      total += highlightInTextNode(textNode);
    }

    return total;
  }

  function getHighlights() {
    return Array.from(document.querySelectorAll(`.${HIGHLIGHT_CLASS}`)).filter(
      (el) => el.isConnected
    );
  }

  function setActiveHighlight(index) {
    const highlights = getHighlights();
    highlights.forEach((el) => el.classList.remove("ssf-current"));

    if (index < 0 || index >= highlights.length) return;

    const el = highlights[index];
    el.classList.add("ssf-current");
  }

  function scrollToNextHighlight() {
    const highlights = getHighlights();
    if (!highlights.length) return;

    currentIndex = (currentIndex + 1) % highlights.length;
    const el = highlights[currentIndex];

    setActiveHighlight(currentIndex);

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = "ssf-hidden";
    overlay.innerHTML = `
      <div id="ssf-card">
        <span id="ssf-hands">
          <span class="ssf-hand ssf-left" aria-hidden="true">🫱</span>
          <span class="ssf-hand ssf-right" aria-hidden="true">🫲</span>
        </span>
        <span id="ssf-text">six seven</span>
      </div>
      <div id="ssf-meta">
        <button id="ssf-btn" type="button">Dismiss</button>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    const card = overlay.querySelector("#ssf-card");
    const dismissBtn = overlay.querySelector("#ssf-btn");

    dismissBtn.onclick = (e) => {
      e.stopPropagation();
      disabled = true;
      safelyMutate(clearHighlights);
      currentIndex = -1;
      overlay.classList.add("ssf-hidden");
    };

    card.onclick = (e) => {
      e.stopPropagation();
      scrollToNextHighlight();
    };

    return overlay;
  }

  function safelyMutate(fn) {
    // Prevent our own DOM changes from triggering observer-driven rescans
    if (observer) observer.disconnect();
    try {
      fn();
    } finally {
      if (observer && document.body) {
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          characterData: true
        });
      }
    }
  }

  function scan() {
    if (disabled || isScanning || !document.body) return;

    isScanning = true;
    try {
      safelyMutate(() => {
        clearHighlights();
        currentIndex = -1;

        const matches = walkAndHighlight(document.body);
        const overlay = ensureOverlay();
        overlay.classList.toggle("ssf-hidden", matches === 0);

        // Optional: auto-focus first result on initial scan could be enabled here.
        // We leave behavior as-is so user uses Next.
      });
    } finally {
      isScanning = false;
    }
  }

  function scheduleScan() {
    if (disabled || isScanning) return;
    clearTimeout(debounce);
    debounce = setTimeout(scan, 250);
  }

  // Initial scan
  ensureOverlay();
  scan();

  // Watch for page changes (SPA / dynamic content)
  observer = new MutationObserver((mutations) => {
    if (disabled || isScanning) return;

    // Ignore mutations that happen only inside our overlay
    const relevant = mutations.some((m) => {
      const target = m.target;
      if (!(target instanceof Node)) return false;

      const el =
        target.nodeType === Node.ELEMENT_NODE
          ? target
          : target.parentElement;

      if (el && el.closest && el.closest(`#${OVERLAY_ID}`)) return false;

      // Also ignore highlight-only mutations if they somehow slip through
      if (el && el.closest && el.closest(`.${HIGHLIGHT_CLASS}`)) return false;

      return true;
    });

    if (relevant) scheduleScan();
  });

  if (document.body) {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }
})();