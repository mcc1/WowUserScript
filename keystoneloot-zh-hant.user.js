// ==UserScript==
// @name         KeystoneLoot Traditional Chinese
// @namespace    https://keystoneloot.io/
// @version      0.3.0
// @description  Translate KeystoneLoot WoW class pages to Traditional Chinese and patch Wowhead links.
// @author       mcc
// @match        https://keystoneloot.io/en/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.7.4
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=2
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/keystoneloot-tw.js?v=1.1.0
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
  const inlineTw = dictionary && dictionary.INLINE_TW ? dictionary.INLINE_TW : {};
  const roleTw = dictionary && dictionary.ROLE_TW ? dictionary.ROLE_TW : {};
  const exactTwCi = Object.freeze(
    Object.fromEntries(Object.entries(exactTw).map(([key, value]) => [key.toLowerCase(), value]))
  );
  const wowheadNameMap = new Map();
  let wowheadNameRescanTimer = null;
  const SITE_UI_NAME_EXCEPTIONS = new Set(['cookie', 'cookies']);

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

  function translatePageHeading(value) {
    const match = String(value || '').trim().match(/^(.+?)\s+best in slot gear,\s+Season\s+(\d+)$/i);
    if (!match) return null;

    const titleTw = translateGameSequence(match[1]) || match[1];
    return `${titleTw}最佳配裝，第 ${match[2]} 季`;
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

  function translateInlineTerms(value) {
    let translated = String(value || '');
    let changed = false;
    const entries = Object.entries(inlineTw).sort(([left], [right]) => right.length - left.length);

    for (const [english, traditional] of entries) {
      const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(^|[^A-Za-z])${escaped}(?=$|[^A-Za-z])`, 'gi');
      translated = translated.replace(pattern, (match, prefix) => {
        changed = true;
        return `${prefix}${traditional}`;
      });
    }

    return changed ? translated : null;
  }

  function translateEmbeddedGameNames(value) {
    const source = String(value || '');
    const tokens = [];
    const tokenPattern = /[A-Za-z][A-Za-z'’:-]*/g;
    let tokenMatch;
    while ((tokenMatch = tokenPattern.exec(source))) {
      tokens.push({ start: tokenMatch.index, end: tokenPattern.lastIndex });
    }

    const replacements = [];
    for (let index = 0; index < tokens.length; index += 1) {
      let replacement = null;
      const maxWords = Math.min(6, tokens.length - index);

      for (let size = maxWords; size >= 1; size -= 1) {
        const end = tokens[index + size - 1].end;
        const phrase = source.slice(tokens[index].start, end);
        if (size === 1 && SITE_UI_NAME_EXCEPTIONS.has(phrase.toLowerCase())) continue;
        const traditional = lookupGameName(phrase);
        if (traditional && traditional !== phrase) {
          replacement = { end, traditional, size };
          break;
        }
      }

      if (replacement) {
        replacements.push({
          start: tokens[index].start,
          end: replacement.end,
          value: replacement.traditional,
        });
        index += replacement.size - 1;
      }
    }

    if (!replacements.length) return null;

    let translated = source;
    for (let index = replacements.length - 1; index >= 0; index -= 1) {
      const replacement = replacements[index];
      translated = `${translated.slice(0, replacement.start)}${replacement.value}${translated.slice(replacement.end)}`;
    }
    return translated !== source ? translated : null;
  }

  function translateEmbeddedUnitSequences(value) {
    const source = String(value || '');
    const tokens = [];
    const tokenPattern = /[A-Za-z][A-Za-z'’:-]*/g;
    let tokenMatch;
    while ((tokenMatch = tokenPattern.exec(source))) {
      tokens.push({ start: tokenMatch.index, end: tokenPattern.lastIndex });
    }

    const replacements = [];
    for (let index = 0; index < tokens.length; index += 1) {
      let replacement = null;
      const maxWords = Math.min(3, tokens.length - index);

      for (let size = maxWords; size >= 2; size -= 1) {
        const end = tokens[index + size - 1].end;
        const phrase = source.slice(tokens[index].start, end);
        const traditional = translateGameSequence(phrase);
        if (traditional) {
          replacement = { end, traditional, size };
          break;
        }
      }

      if (replacement) {
        replacements.push({
          start: tokens[index].start,
          end: replacement.end,
          value: replacement.traditional,
        });
        index += replacement.size - 1;
      }
    }

    if (!replacements.length) return null;

    let translated = source;
    for (let index = replacements.length - 1; index >= 0; index -= 1) {
      const replacement = replacements[index];
      translated = `${translated.slice(0, replacement.start)}${replacement.value}${translated.slice(replacement.end)}`;
    }
    return translated !== source ? translated : null;
  }

  function translateKnownWowheadNames(value) {
    let translated = String(value || '');
    let changed = false;
    const entries = Array.from(wowheadNameMap.values())
      .filter((entry) => entry.english && entry.traditional && entry.english !== entry.traditional)
      .sort((left, right) => right.english.length - left.english.length);

    for (const entry of entries) {
      const escaped = entry.english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(^|[^A-Za-z0-9])${escaped}(?=$|[^A-Za-z0-9])`, 'gi');
      translated = translated.replace(pattern, (match, prefix) => {
        changed = true;
        return `${prefix}${entry.traditional}`;
      });
    }

    return changed ? translated : null;
  }

  function translateBestInSlotParagraph(value) {
    const match = String(value || '').trim().match(
      /^The best in slot list for (.+?) in (.+?) Season (\d+) covers (\d+) slots at item level (\d+)\.\s+(.+)$/i
    );
    if (!match) return null;

    const specTw = translateGameSequence(match[1]);
    if (!specTw) return null;

    let details = translateKnownWowheadNames(match[6]) || match[6];
    details = translateEmbeddedGameNames(details) || details;
    details = details
      .replace(/\s+drop from\s+/gi, ' 掉落自 ')
      .replace(/\s+are crafted rather than dropped/gi, ' 為製作物品，並非掉落物品')
      .replace(/\s+is made at the Catalyst from a normal piece of the same slot/gi, ' 可在催化器中由同部位的一般物品轉化而成')
      .replace(/\s+in\s+/gi, ' 於 ')
      .replace(/\s+and\s+/gi, ' 以及 ')
      .replace(/\.(?=\s|$)/g, '。')
      .replace(/。\s+/g, '。');
    details = translateInlineTerms(details) || details;
    details = translateSlotLabels(details) || details;

    return `最佳配裝清單：${specTw}，適用於${match[2] === 'Midnight' ? '至暗之夜' : match[2]}第 ${match[3]} 季，共涵蓋 ${match[4]} 個部位，物品等級 ${match[5]}。${details}`;
  }

  function translateStatParagraph(value) {
    const match = String(value || '').trim().match(
      /^Based on the last two weeks of data, the stat priority for (.+?) comes out as (.+?)\. These numbers describe the gear players are actually wearing, so they can lean toward whatever is easiest to get hold of right now\.$/i
    );
    if (!match) return null;

    const specTw = translateGameSequence(match[1]);
    const priorityTw = translateInlineTerms(match[2]) || match[2];
    if (!specTw) return null;

    return `根據過去兩週的資料，${specTw} 的屬性優先順序為 ${priorityTw}。這些數值描述的是玩家實際穿著的裝備，因此優先順序可能會偏向目前較容易取得的屬性。`;
  }

  function translateSlotLabels(value) {
    let translated = String(value || '');
    let changed = false;
    const slotLabels = [
      'Head', 'Neck', 'Shoulder', 'Back', 'Chest', 'Wrist', 'Hands', 'Waist',
      'Legs', 'Feet', 'Ring', 'Ring 1', 'Ring 2', 'Trinket', 'Trinket 1',
      'Trinket 2', 'Main hand', 'Off hand', 'Shirt', 'Tabard',
    ];

    for (const english of slotLabels) {
      const traditional = exactTwCi[english.toLowerCase()];
      if (!traditional) continue;
      const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\(${escaped}\\)`, 'gi');
      translated = translated.replace(pattern, () => {
        changed = true;
        return `(${traditional})`;
      });
    }

    return changed ? translated : null;
  }

  function replaceTrimmed(original, trimmed, translated) {
    return original.replace(trimmed, translated);
  }

  function translateText(rawText) {
    const text = String(rawText || '');
    const trimmed = text.trim();
    if (!trimmed) return null;
    if (SITE_UI_NAME_EXCEPTIONS.has(trimmed.toLowerCase())) return null;

    const hasExact = Object.prototype.hasOwnProperty.call(exactTw, trimmed)
      || Object.prototype.hasOwnProperty.call(exactTwCi, trimmed.toLowerCase());
    const exact = hasExact
      ? (Object.prototype.hasOwnProperty.call(exactTw, trimmed) ? exactTw[trimmed] : exactTwCi[trimmed.toLowerCase()])
      : null;
    if (hasExact) {
      if (exact && exact !== trimmed) {
        return replaceTrimmed(text, trimmed, exact);
      }
      return null;
    }
    // Exact UI 翻譯後可能再次被站方拆成含 Cookie 的新文字節點；不要讓
    // generated lookup 把其中的 Cookie 當成同名遊戲資料。
    if (/\bcookies?\b/i.test(trimmed)) return null;

    const statParagraph = translateStatParagraph(trimmed);
    if (statParagraph) {
      return replaceTrimmed(text, trimmed, statParagraph);
    }

    const knownNames = translateKnownWowheadNames(trimmed);
    const workingText = knownNames || trimmed;

    const pageHeading = translatePageHeading(workingText);
    if (pageHeading && pageHeading !== trimmed) {
      return replaceTrimmed(text, trimmed, pageHeading);
    }

    const gameSource = translateGameSource(workingText);
    if (gameSource) {
      return replaceTrimmed(text, trimmed, gameSource);
    }

    const allSpecsMatch = workingText.match(/^(←\s*)?All\s+(.+?)\s+specs$/i);
    if (allSpecsMatch) {
      const classTw = translateGameSequence(allSpecsMatch[2]);
      if (classTw) {
        const arrow = allSpecsMatch[1] ? '← ' : '';
        return replaceTrimmed(text, trimmed, `${arrow}所有${classTw}專精`);
      }
    }

    const bestInSlot = translateBestInSlotParagraph(workingText);
    if (bestInSlot) {
      return replaceTrimmed(text, trimmed, bestInSlot);
    }

    const gameSequence = translateGameSequence(workingText);
    if (gameSequence) {
      return replaceTrimmed(text, trimmed, gameSequence);
    }

    const inlineTerms = translateInlineTerms(workingText);
    const embeddedGameNames = translateEmbeddedGameNames(inlineTerms || workingText);
    const embeddedUnitSequences = translateEmbeddedUnitSequences(embeddedGameNames || inlineTerms || workingText);
    const longText = embeddedUnitSequences || embeddedGameNames || inlineTerms || knownNames;
    if (longText && longText !== trimmed) {
      return replaceTrimmed(text, trimmed, longText);
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

  function translateSourceConnectors(root) {
    if (!(root instanceof Element)) return;

    const sources = [];
    if (root.matches('.text-source')) sources.push(root);
    sources.push(...root.querySelectorAll('.text-source'));

    for (const source of sources) {
      const sourceAnchor = source.closest('a');
      let container = sourceAnchor || source;

      for (let depth = 0; depth < 5 && container; depth += 1) {
        if (container.querySelectorAll('.text-source').length === 1) {
          const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
          let node = walker.nextNode();
          while (node) {
            if (!source.contains(node)) {
              const match = node.textContent.match(/^(\s*)(in|from)(\s*)$/i);
              if (match) {
                const connector = match[2].toLowerCase() === 'in' ? '於' : '來自';
                node.textContent = `${match[1]}${connector}${match[3]}`;
              }
            }
            node = walker.nextNode();
          }

          if (container.textContent.includes('於') || container.textContent.includes('來自')) {
            break;
          }
        }

        container = container.parentElement;
      }
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
    const seasonMatch = document.title.match(/^(.+?)\s+BiS Item List\s+·\s+Season\s+(\d+)\s+·\s+KeystoneLoot$/i);
    if (seasonMatch) {
      const specTw = translateGameSequence(seasonMatch[1]);
      if (specTw) {
        document.title = `${specTw}最佳配裝 · 第 ${seasonMatch[2]} 季 · KeystoneLoot`;
      }
      return;
    }

    const match = document.title.match(/^(.+?)\s+·\s+KeystoneLoot$/);
    if (!match) return;

    const translated = translateText(match[1]) || translateGameSequence(match[1]);
    if (translated && translated !== match[1]) {
      document.title = `${translated} · KeystoneLoot`;
    }
  }

  function getWowheadNameKey(href) {
    const match = String(href || '').match(/\/(item|spell|currency)(?:=|\/)(\d+)/i);
    return match ? `${match[1].toLowerCase()}:${match[2]}` : null;
  }

  function collectWowheadNames(root) {
    const links = [];
    if (root instanceof HTMLAnchorElement && root.matches('a[href*="wowhead.com"]')) {
      links.push(root);
    }
    if (root instanceof Document || root instanceof Element) {
      links.push(...root.querySelectorAll('a[href*="wowhead.com"]'));
    }

    let changed = false;
    for (const link of links) {
      const key = getWowheadNameKey(link.getAttribute('href'));
      const text = (link.textContent || '').trim();
      if (!key || !text || !/[A-Za-z\u4e00-\u9fa5]/.test(text)) continue;

      const entry = wowheadNameMap.get(key) || {};
      if (/[一-龥]/.test(text)) {
        if (entry.traditional !== text) {
          entry.traditional = text;
          changed = true;
        }
      } else if (/[A-Za-z]/.test(text) && entry.english !== text) {
        entry.english = text;
        changed = true;
      }
      wowheadNameMap.set(key, entry);
    }
    return changed;
  }

  function scheduleWowheadNameRescan() {
    if (wowheadNameRescanTimer !== null) return;

    wowheadNameRescanTimer = window.setTimeout(() => {
      wowheadNameRescanTimer = null;
      if (document.body && collectWowheadNames(document.body)) {
        walkTextNodes(document.body);
      }
    }, 500);
  }

  const helper = typeof window !== 'undefined' && typeof window.WowheadTwHelper !== 'undefined'
    ? new window.WowheadTwHelper({
        enableRenameLinks: true,
        enableSafeLinkify: true,
        onScan: (root) => {
          // Widget 會以新 span 取代 anchor 內的文字；此時 MutationObserver 的
          // root 可能只是該 span，必須從整頁 anchors 收集英文／繁中配對。
          const wowheadNamesChanged = collectWowheadNames(document.body);
          translateAttributesInTree(root);
          walkTextNodes(root);
          if (wowheadNamesChanged) {
            // 長句可能已在 widget 改名以前被快取；名稱配對補齊後要讓整頁重掃，
            // 否則 WeakMap 會把含有舊英文物品名的長句誤判成已處理。
            translatedNodeText = new WeakMap();
            walkTextNodes(document.body);
          }
          scheduleWowheadNameRescan();
          translateSourceConnectors(root);
          translateDocumentTitle();
        },
        onUrlChange: () => {
          translatedNodeText = new WeakMap();
        },
      })
    : null;

  if (helper) {
    helper.registerNonItemNames(Object.keys(exactTw));
    // 來源標籤是獨立的文字節點；在 onScan 翻譯前，safe linkify 不應把它們
    // 誤判成鄰近物品名稱並綁到裝備圖示上。
    helper.registerNonItemNames(['in', 'from']);
    helper.registerGameNameLookup(lookupGameName);
    helper.start();
  }
})();
