(() => {
  const OVERLAY_ID = "ssf-overlay";
  const HIGHLIGHT_CLASS = "ssf-highlight";

  const PATTERN = new RegExp(
    [
      "(?<!\\d)67(?!\\d)",                          //67 not embedded in a larger number
      "(?<!\\d)6[\\.,]7(?!\\d)",                    //6.7 or 6,7 (decimal dot/comma)
      "(?<!\\d)6[\\-\\u2013\\u2014]7(?!\\d)",        //6-7 / 6–7 / 6—7
      "(?<!\\d)6\\s*,\\s*7(?!\\d)",                 //6, 7
      "(?<!\\d)6\\s*[~\\uFF5E\\u301C]\\s*7(?!\\d)",  //6~7 / 6～7 / 6〜7
      "(?<!\\d)6\\s+(?:or|to)\\s+7(?!\\d)",         //6 or 7 / 6 to 7
  
      //English
      "\\bsix[\\s,\\-]+seven\\b",                    //six seven / six-seven / six, seven
      "\\bsix\\s+(?:or|to)\\s+seven\\b",             //six or seven / six to seven
      "\\bsix\\s+point\\s+seven\\b",                 //six point seven
      "\\bsixty[\\s\\-]?seven\\b",                   //sixty seven / sixty-seven
  
      //Chinese
      "六十七",                                       //67
      "六点七",                                       //6.7
      "六\\s*[~\\-—–～〜]\\s*七",                      //六~七 / 六-七 etc
      "六\\s*,\\s*七",                               //六,七
      "六(?:至|到)七",                               //六至七 / 六到七  (to)
      "六或七",                                       //六或七  (or)
      "六七",                                         //六七 (six seven)
  
      //Spanish
      "\\bseis[\\s,\\-]+siete\\b",                   //seis siete / seis-siete / seis, siete
      "\\bseis\\s+(?:o|u)\\s+siete\\b",              //seis o siete (or)
      "\\bseis\\s+a\\s+siete\\b",                    //seis a siete (to)
      "\\bseis\\s+punto\\s+siete\\b",                //seis punto siete
      "\\bseis\\s+coma\\s+siete\\b",                 //seis coma siete
      "\\bsesenta\\s+y\\s+siete\\b",                 //sesenta y siete (67)
  
      
      //French
      "\\bsix[\\s,\\-]+sept\\b",                     //six sept / six-sept / six, sept
      "\\bsix\\s+ou\\s+sept\\b",                     //six ou sept (or)
      "\\b(?:de\\s+)?six\\s+à\\s+sept\\b",           //(de) six à sept (to)
      "\\bsix\\s+(?:virgule|point)\\s+sept\\b",      //six virgule sept / six point sept
      "\\bsoixante[\\s\\-]?sept\\b",                 //soixante-sept / soixante sept (67)
  
      
      //German
      "\\bsechs[\\s,\\-]+sieben\\b",                 //sechs sieben / sechs-sieben / sechs, sieben
      "\\bsechs\\s+oder\\s+sieben\\b",               //sechs oder sieben (or)
      "\\b(?:von\\s+)?sechs\\s+bis\\s+sieben\\b",    //(von) sechs bis sieben (to)
      "\\bsechs\\s+(?:komma|punkt)\\s+sieben\\b",    //sechs komma sieben / sechs punkt sieben
      "\\bsiebenundsechzig\\b",                      //67
  
      
      //Russian
      "\\bшесть[\\s,\\-]+семь\\b",                   //шесть семь / шесть-семь / шесть, семь
      "\\bшесть\\s+или\\s+семь\\b",                  //шесть или семь (or)
      "\\b(?:от\\s+)?шести\\s+до\\s+семи\\b",        //(от) шести до семи (to)  [common case form]
      "\\bшесть\\s+(?:точка|запятая)\\s+семь\\b",    //шесть точка семь / шесть запятая семь
      "\\bшестьдесят\\s+семь\\b",                    //шестьдесят семь (67)
  
      
      //Portuguese
      "\\bseis[\\s,\\-]+sete\\b",                    //seis sete / seis-sete / seis, sete
      "\\bseis\\s+ou\\s+sete\\b",                    //seis ou sete (or)
      "\\b(?:de\\s+)?seis\\s+a\\s+sete\\b",          //(de) seis a sete (to)
      "\\bseis\\s+(?:ponto|vírgula|virgula)\\s+sete\\b", //seis ponto sete / seis vírgula sete
      "\\bsessenta\\s+e\\s+sete\\b",                 //sessenta e sete (67)
  
      
      //Japanese
      "六十七",                                       //67
      "六点七",                                       //6.7
      "六\\s*[~\\-—–～〜]\\s*七",                      //六〜七 etc
      "六\\s*,\\s*七",                               //六,七
      "六(?:から|〜|～|−|ー|—|–)七",                  //六から七 / 六〜七 variants
      "六か七",                                       //六か七 (or)
      "六七",                                         //六七 (six seven)
  
      
      //Korean
      "\\b여섯[\\s,\\-]+일곱\\b",                     //여섯 일곱 / 여섯-일곱 / 여섯, 일곱
      "\\b여섯\\s+(?:또는|혹은)\\s+일곱\\b",           //여섯 또는 일곱 (or)
      "\\b여섯\\s+(?:부터|에서)\\s+일곱\\b",           //여섯부터 일곱 / 여섯에서 일곱 (to)
      "\\b여섯\\s+점\\s+칠\\b",                       //여섯 점 칠 (6.7)
      "\\b육십칠\\b|\\b예순[\\s\\-]?일곱\\b",          //67 (Sino / native)
  
      
      //Indonesian
      "\\benam[\\s,\\-]+tujuh\\b",                   //enam tujuh / enam-tujuh / enam, tujuh
      "\\benam\\s+atau\\s+tujuh\\b",                 //enam atau tujuh (or)
      "\\benam\\s+(?:sampai|hingga)\\s+tujuh\\b",    //enam sampai tujuh (to)
      "\\benam\\s+(?:koma|titik)\\s+tujuh\\b",       //enam koma tujuh / enam titik tujuh
      "\\benam\\s+puluh\\s+tujuh\\b",                //enam puluh tujuh (67)
  
      
      //Turkish
      "\\baltı[\\s,\\-]+yedi\\b",                    //altı yedi / altı-yedi / altı, yedi
      "\\baltı\\s+(?:veya|ya\\s+da)\\s+yedi\\b",      //altı veya yedi / altı ya da yedi (or)
      "\\baltı\\s+(?:ile|den|dan)\\s+yedi\\b",        //loose "to" forms seen in text
      "\\baltı\\s+nokta\\s+yedi\\b",                 //altı nokta yedi (6.7)
      "\\baltmış\\s+yedi\\b",                        //altmış yedi (67)
  
      
      //Hindi
      "छह[\\s,\\-]+सात",                              //छह सात / छह-सात / छह, सात
      "छह\\s+या\\s+सात",                             //छह या सात (or)
      "छह\\s+से\\s+सात",                             //छह से सात (to)
      "छह\\s+(?:दशमलव|बिंदु)\\s+सात",                 //छह दशमलव सात / छह बिंदु सात (6.7)
      "सड़सठ"                                         //67
    ].join("|"),
    "giu"
  );

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

  function clearHighlights() {
    const spans = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    spans.forEach((span) => {
      span.replaceWith(document.createTextNode(span.textContent || ""));
    });
  }

  function highlightInTextNode(textNode) {
    const text = textNode.nodeValue;
    if (!text) return 0;

    //IMPORTANT: reset before any .test() / .exec() because PATTERN is global (/g)
    PATTERN.lastIndex = 0;
    if (!PATTERN.test(text)) return 0;

    PATTERN.lastIndex = 0;
    let last = 0;
    let match;
    let count = 0;

    const frag = document.createDocumentFragment();

    while ((match = PATTERN.exec(text)) !== null) {
      //Append text before match
      if (match.index > last) {
        frag.append(document.createTextNode(text.slice(last, match.index)));
      }

      //Append highlight
      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.textContent = match[0];
      frag.append(span);

      last = match.index + match[0].length;
      count++;

      //Safety for zero-length matches (not expected here, but defensive)
      if (PATTERN.lastIndex === match.index) {
        PATTERN.lastIndex++;
      }
    }

    //Append trailing text
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
    // Prevent our own DOM changes from triggering observer-driven rescans
    const hadObserver = !!observer;
    if (hadObserver) observer.disconnect();
  
    try {
      fn();
    } finally {
      // Only re-observe if we are active and not disabled
      if (hadObserver && !disabled && isPageActive() && document.body) {
        startObserving();
      }
    }
  }

  function scan() {
    if (disabled || isScanning || !document.body) return;
    if (!isPageActive()) return;

    isScanning = true;
    try {
      safelyMutate(() => {
        clearHighlights();
        currentIndex = -1;

        const matches = walkAndHighlight(document.body);
        const overlay = ensureOverlay();
        overlay.classList.toggle("ssf-hidden", matches === 0);

        //Optional: auto-focus first result on initial scan could be enabled here.
        //We leave behavior as-is so user uses Next.
      });
    } finally {
      isScanning = false;
    }
  }

  function scheduleScan() {
    if (disabled || isScanning) return;
    if (!isPageActive()) return;
    clearTimeout(debounce);
    debounce = setTimeout(scan, 1000);
  }

  //Initial scan
  ensureOverlay();
  scan();

  //Watch for page changes (SPA / dynamic content)
  observer = new MutationObserver((mutations) => {
    if (disabled || isScanning) return;

    //Ignore mutations that happen only inside our overlay
    const relevant = mutations.some((m) => {
      const target = m.target;
      if (!(target instanceof Node)) return false;

      const el =
        target.nodeType === Node.ELEMENT_NODE
          ? target
          : target.parentElement;

      if (el && el.closest && el.closest(`#${OVERLAY_ID}`)) return false;

      //Also ignore highlight-only mutations if they somehow slip through
      if (el && el.closest && el.closest(`.${HIGHLIGHT_CLASS}`)) return false;

      return true;
    });

    if (relevant) scheduleScan();
  });

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