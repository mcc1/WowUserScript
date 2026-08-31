// ==UserScript==
// @name         KeystoneLoot Traditional Chinese
// @namespace    https://keystoneloot.io/
// @version      0.2.0
// @description  Translate KeystoneLoot WoW class pages to Traditional Chinese and patch Wowhead links.
// @author       mcc
// @match        https://keystoneloot.io/en/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.7.3
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=2
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/keystoneloot-tw.js?v=1.0.0
// @updateURL    https://raw.githubusercontent.com/mcc1/WowUserScript/master/keystoneloot-zh-hant.user.js
// @downloadURL  https://raw.githubusercontent.com/mcc1/WowUserScript/master/keystoneloot-zh-hant.user.js
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const dictionary = typeof window !== 'undefined'
    ? window.KeystoneLootTwDictionary
    : null;
  const exactTw = dictionary && dictionary.EXACT_TW ? dictionary.EXACT_TW : {};
  const roleTw = dictionary && dictionary.ROLE_TW ? dictionary.ROLE_TW : {};
  const exactTwCi = Object.freeze(
    Object.fromEntries(Object.entries(exactTw).map(([key, value]) => [key.toLowerCase(), value]))
  );

  let translatedNodeText = new WeakMap();

  function gameNames() {
    return typeof window !== 'undefined' ? window.WowGameNamesTw : null;
  }

  function lookupGameUnit(value) {
    const table = gameNames();
    if (!table || typeof table.lookupUnit !== 'function' || !value) return null;
    try {
      return table.lookupUnit(value);
    } catch (_) {
      return null;
    }
  }

  function lookupGameName(value) {
    const table = gameNames();
    if (!table || typeof table.lookup !== 'function' || !value) return null;
    try {
      return table.lookup(value);
    } catch (_) {
      return null;
    }
  }

  function translateGameSource(value) {
    const trimmed = String(value || '').trim();
    if (!trimmed) return null;

    const direct = lookupGameName(trimmed);
    if (direct && direct !== trimmed) return direct;

    const sourceMatch = trimmed.match(/^(.+?)\s+(in|from)\s+(.+)$/i);
    if (!sourceMatch) return null;

    const left = sourceMatch[1].trim();
    const connector = sourceMatch[2].toLowerCase();
    const right = sourceMatch[3].trim();
    const leftTw = lookupGameName(left) || left;
    const rightTw = lookupGameName(right) || right;
    if (leftTw === left && rightTw === right) return null;

    const connectorTw = connector === 'in' ? '於' : '來自';
    return `${leftTw} ${connectorTw} ${rightTw}`;
  }

  function translateGameSequence(value) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return null;

    const translated = [];
    let changed = false;
    let index = 0;

    while (index < words.length) {
      let match = null;
      const maxWords = Math.min(5, words.length - index);

      for (let size = maxWords; size >= 1; size -= 1) {
        const phrase = words.slice(index, index + size).join(' ');
        const tw = lookupGameUnit(phrase) || roleTw[phrase.toUpperCase()] || null;
        if (tw) {
          match = { size, tw };
          break;
        }
      }

      if (!match) return null;
      translated.push(match.tw);
      changed = changed || match.tw !== words.slice(index, index + match.size).join(' ');
      index += match.size;
    }

    return changed ? translated.join(' ') : null;
  }

  function replaceTrimmed(original, trimmed, translated) {
    return original.replace(trimmed, translated);
  }

  function translateText(rawText) {
    const text = String(rawText || '');
    const trimmed = text.trim();
    if (!trimmed) return null;

    const exact = Object.prototype.hasOwnProperty.call(exactTw, trimmed)
      ? exactTw[trimmed]
      : exactTwCi[trimmed.toLowerCase()];
    if (exact && exact !== trimmed) {
      return replaceTrimmed(text, trimmed, exact);
    }

    const gameSource = translateGameSource(trimmed);
    if (gameSource) {
      return replaceTrimmed(text, trimmed, gameSource);
    }

    const allSpecsMatch = trimmed.match(/^←\s*All\s+(.+?)\s+specs$/i);
    if (allSpecsMatch) {
      const classTw = translateGameSequence(allSpecsMatch[1]);
      if (classTw) {
        return replaceTrimmed(text, trimmed, `← 所有${classTw}專精`);
      }
    }

    const gameSequence = translateGameSequence(trimmed);
    if (gameSequence) {
      return replaceTrimmed(text, trimmed, gameSequence);
    }

    return null;
  }

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'OPTION',
    'CODE', 'PRE', 'KBD', 'SAMP',
  ]);

  function shouldSkipElement(element) {
    return SKIP_TAGS.has(element.tagName) || element.isContentEditable;
  }

  function walkTextNodes(root) {
    const rootNode = root instanceof Document ? root.body : root;
    if (!(rootNode instanceof Node)) return;

    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          let current = parent;
          while (current) {
            if (shouldSkipElement(current)) return NodeFilter.FILTER_REJECT;
            if (current === rootNode) break;
            current = current.parentElement;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const updates = [];
    let node = walker.nextNode();
    while (node) {
      const original = node.textContent;
      if (translatedNodeText.get(node) === original) {
        node = walker.nextNode();
        continue;
      }

      const translated = translateText(original);
      if (translated && translated !== original) {
        updates.push({ node, translated });
      }
      node = walker.nextNode();
    }

    for (const update of updates) {
      update.node.textContent = update.translated;
      translatedNodeText.set(update.node, update.translated);
    }
  }

  const ATTRIBUTE_NAMES = ['aria-label', 'title', 'placeholder'];

  function translateElementAttributes(element) {
    let touched = false;
    for (const name of ATTRIBUTE_NAMES) {
      const value = element.getAttribute(name);
      const translated = value ? translateText(value) : null;
      if (translated && translated !== value) {
        element.setAttribute(name, translated);
        touched = true;
      }
    }

    if (
      element instanceof HTMLInputElement &&
      ['button', 'submit', 'reset'].includes((element.type || '').toLowerCase())
    ) {
      const value = element.getAttribute('value');
      const translated = value ? translateText(value) : null;
      if (translated && translated !== value) {
        element.setAttribute('value', translated);
        touched = true;
      }
    }

    return touched;
  }

  function translateAttributesInTree(root) {
    if (!(root instanceof Element)) return;
    translateElementAttributes(root);
    for (const element of root.querySelectorAll('[aria-label], [title], [placeholder], input[value]')) {
      translateElementAttributes(element);
    }
  }

  function translateDocumentTitle() {
    const match = document.title.match(/^(.+?)\s+·\s+KeystoneLoot$/);
    if (!match) return;

    const translated = translateText(match[1]) || translateGameSequence(match[1]);
    if (translated && translated !== match[1]) {
      document.title = `${translated} · KeystoneLoot`;
    }
  }

  const helper = typeof window !== 'undefined' && typeof window.WowheadTwHelper !== 'undefined'
    ? new window.WowheadTwHelper({
        enableRenameLinks: true,
        enableSafeLinkify: true,
        onScan: (root) => {
          translateAttributesInTree(root);
          walkTextNodes(root);
          translateDocumentTitle();
        },
        onUrlChange: () => {
          translatedNodeText = new WeakMap();
        },
      })
    : null;

  if (helper) {
    helper.registerNonItemNames(Object.keys(exactTw));
    helper.registerGameNameLookup(lookupGameName);
    helper.start();
  }
})();
