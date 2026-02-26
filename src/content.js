(() => {
  const OVERLAY_ID = "ssf-overlay";
  const HIGHLIGHT_CLASS = "ssf-highlight";
  const PATTERN = createPattern();

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

  function isPageActive() {
    return document.visibilityState === "visible";
  }

  function startObserving() {
    if (!observer || !document.body) return;
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  
  function stopObserving() {
    if (!observer) return;
    observer.disconnect();
  }

  function isBlockedNode(node) {
    const el = node.parentElement;
    if (!el) return true;
    if (BLOCKED_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.closest(`#${OVERLAY_ID}`)) return true;
    if (el.closest(`.${HIGHLIGHT_CLASS}`)) return true; //avoid re-processing inside highlights
    return false;
  }

  function clearHighlights(root = document) {
    const spans = root.querySelectorAll
      ? root.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
      : [];

    spans.forEach((span) => {
      span.replaceWith(document.createTextNode(span.textContent || ""));
    });
  }

  function highlightInTextNode(textNode) {
    const text = textNode.nodeValue;
    if (!text) return 0;

    PATTERN.lastIndex = 0;
    let match = PATTERN.exec(text);
    if (!match) return 0;

    PATTERN.lastIndex = 0;
    let last = 0;
    let count = 0;

    const frag = document.createDocumentFragment();

    while ((match = PATTERN.exec(text)) !== null) {
      if (match.index > last) {
        frag.append(document.createTextNode(text.slice(last, match.index)));
      }

      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.textContent = match[0];
      frag.append(span);

      last = match.index + match[0].length;
      count++;

      if (PATTERN.lastIndex === match.index) {
        PATTERN.lastIndex++;
      }
    }

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
      //Skip if node was detached by prior replacements
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
  observer?.disconnect();
  try {
    fn();
  } finally {
    if (!disabled && isPageActive() && document.body) {
      startObserving(); // startObserving already checks observer existence
    }
  }
  }

  function scan() {
    if (disabled || isScanning || !document.body) return;
    if (!isPageActive()) return;

    isScanning = true;
    try {
      safelyMutate(() => {
        // Full scan only (initial / visibility resume)
        clearHighlights(document.body);
        currentIndex = -1;

        const matches = walkAndHighlight(document.body);
        const overlay = ensureOverlay();
        overlay.classList.toggle("ssf-hidden", matches === 0);
      });
    } finally {
      isScanning = false;
    }
  }

  let pendingRoots = new Set();

  /**
   * Returns a reasonable element root to rescan for a mutation.
   * Prefer a small-ish subtree: element itself, else parentElement.
   */
  function mutationToRoot(m) {
    // Ignore overlay/highlight owned nodes early
    const target = m.target;
    const el =
      target?.nodeType === Node.ELEMENT_NODE
        ? target
        : target?.parentElement;

    if (!el) return null;
    if (el.closest?.(`#${OVERLAY_ID}`)) return null;
    if (el.closest?.(`.${HIGHLIGHT_CLASS}`)) return null;

    // For childList, added nodes are more specific than target
    if (m.type === "childList" && m.addedNodes?.length) {
      for (const n of m.addedNodes) {
        const nEl =
          n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement;
        if (nEl && !nEl.closest?.(`#${OVERLAY_ID}`) && !nEl.closest?.(`.${HIGHLIGHT_CLASS}`)) {
          return nEl;
        }
      }
    }

    return el;
  }

  /**
   * Clears + re-highlights within each pending root (incremental scan).
   * Also updates overlay visibility.
   */
  function flushIncremental() {
    if (disabled || isScanning) return;
    if (!isPageActive() || !document.body) return;
    if (!pendingRoots.size) return;

    isScanning = true;
    try {
      safelyMutate(() => {
        // Snapshot and reset set so new mutations can queue while we work
        const roots = Array.from(pendingRoots);
        pendingRoots.clear();

        // Clear + rehighlight each subtree
        for (const root of roots) {
          if (!root || !root.isConnected) continue;

          // Avoid scanning huge areas if mutation root is html/body
          const boundedRoot =
            root === document.documentElement || root === document.body
              ? document.body
              : root;

          clearHighlights(boundedRoot);
          walkAndHighlight(boundedRoot);
        }

        // Overlay should reflect global highlight count
        const overlay = ensureOverlay();
        const any = document.querySelector(`.${HIGHLIGHT_CLASS}`) != null;
        overlay.classList.toggle("ssf-hidden", !any);

        // If content changed, active index may point to removed nodes
        // Keep it simple: reset
        currentIndex = -1;
      });
    } finally {
      isScanning = false;
    }
  }

  function scheduleIncremental(root) {
    if (disabled || isScanning) return;
    if (!isPageActive()) return;

    if (root && root.isConnected) pendingRoots.add(root);

    clearTimeout(debounce);
    debounce = setTimeout(flushIncremental, 250); // faster than 1000ms now that it’s smaller work
  }



  //Watch for page changes (SPA / dynamic content)
  observer = new MutationObserver((mutations) => {
  if (disabled || isScanning) return;
  if (!isPageActive()) return;

  let queued = false;

  for (const m of mutations) {
    const root = mutationToRoot(m);
    if (!root) continue;

    scheduleIncremental(root);
    queued = true;
  }
  });

  //Initial scan
  ensureOverlay();
  scan();

  document.addEventListener("visibilitychange", () => {
    console.log("Visibility changed:", document.visibilityState);
  
    if (disabled) return;
  
    if (isPageActive()) {
      console.log("START observing");
      startObserving();
      scan();
    } else {
      console.log("STOP observing");
      stopObserving();
    }
  });

  if (isPageActive()) {
    startObserving();
  }
})();