(() => {
  const OVERLAY_ID = "ssf-overlay";
  const HIGHLIGHT_CLASS = "ssf-highlight";

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

  function isBlockedNode(node) {
    const el = node.parentElement;
    if (!el) return true;
    if (BLOCKED_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.closest(`#${OVERLAY_ID}`)) return true;
    return false;
  }

  function clearHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(span => {
      span.replaceWith(document.createTextNode(span.textContent));
    });
  }

  function highlightInTextNode(textNode) {
    const text = textNode.nodeValue;
    if (!text || !PATTERN.test(text)) return 0;

    PATTERN.lastIndex = 0;
    let last = 0;
    let match;
    let count = 0;

    const frag = document.createDocumentFragment();

    while ((match = PATTERN.exec(text))) {
      frag.append(text.slice(last, match.index));

      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.textContent = match[0];
      frag.append(span);

      last = match.index + match[0].length;
      count++;
    }

    frag.append(text.slice(last));
    textNode.replaceWith(frag);
    return count;
  }

  function walkAndHighlight(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: node =>
          node.nodeValue?.trim() && !isBlockedNode(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
      }
    );

    let total = 0;
    let node;
    while ((node = walker.nextNode())) {
      total += highlightInTextNode(node);
    }
    return total;
  }

  function scrollToNextHighlight() {
    const highlights = Array.from(
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
    );
    if (!highlights.length) return;

    currentIndex = (currentIndex + 1) % highlights.length;
    const el = highlights[currentIndex];
    el.scrollIntoView({
      behavior: "smooth",
      block: "center"
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
        <button id="ssf-next">Next</button>
        <button id="ssf-btn">Dismiss</button>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    const nextBtn = overlay.querySelector("#ssf-next");
    const dismissBtn = overlay.querySelector("#ssf-btn");

    dismissBtn.onclick = (e) => {
      e.stopPropagation();
      disabled = true;
      clearHighlights();
      overlay.classList.add("ssf-hidden");
    };

    nextBtn.onclick = (e) => {
      e.stopPropagation();
      scrollToNextHighlight();
    };

    return overlay;
  }

  function scan() {
    if (disabled) return;
    clearHighlights();
    currentIndex = -1;
    const matches = walkAndHighlight(document.body);
    const overlay = ensureOverlay();
    overlay.classList.toggle("ssf-hidden", matches === 0);
  }

  scan();

  let debounce;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(scan, 250);
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
})();
