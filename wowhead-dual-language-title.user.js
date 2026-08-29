// ==UserScript==
// @name         Wowhead Dual-Language Title & Cross-Language Search
// @namespace    https://www.wowhead.com/
// @version      1.4.0
// @description  在 Wowhead 顯示雙語標題，並支援中英文跨語言即時搜尋與結果整合
// @author       mcc
// @match        https://*.wowhead.com/*
// @match        http://*.wowhead.com/*
// @updateURL    https://raw.githubusercontent.com/mcc1/WowUserScript/master/wowhead-dual-language-title.user.js
// @downloadURL  https://raw.githubusercontent.com/mcc1/WowUserScript/master/wowhead-dual-language-title.user.js
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const LOCALE_EN = 0;
  const LOCALE_TW = 10;

  function isTwLocale() {
    return window.location.pathname.startsWith('/tw/') || window.location.hostname.startsWith('tw.');
  }

  // ── 1. 雙語標題 (Dual-Language Title) ──────────────────────────────────────

  const ENTITY_PATH_REGEX = /(?:\/tw)?\/(item|spell|quest|npc|object|achievement|currency|zone|item-set|title|faction|event)[=/](\d+)/i;

  async function fetchAltName(type, id, targetLocale) {
    try {
      const resp = await fetch(`https://nether.wowhead.com/tooltip/${type}/${id}?locale=${targetLocale}`);
      if (!resp.ok) return null;
      const data = await resp.json();
      return data && data.name ? data.name : null;
    } catch (_) {
      return null;
    }
  }

  function getHeadingElement() {
    return document.querySelector('h1[data-text-style="heading-1"], h1.wh-heading-responsive, h1.heading-size-1, h1');
  }

  async function applyDualTitle() {
    const match = window.location.pathname.match(ENTITY_PATH_REGEX);
    if (!match) return;

    const type = match[1].toLowerCase();
    const id = match[2];
    const targetLocale = isTwLocale() ? LOCALE_EN : LOCALE_TW;

    const altName = await fetchAltName(type, id, targetLocale);
    if (!altName) return;

    function insertTitle(heading) {
      if (!heading || heading.dataset.dualTitleApplied === 'true') return;
      heading.dataset.dualTitleApplied = 'true';

      const sep = document.createTextNode(' / ');
      const altSpan = document.createElement('span');
      altSpan.style.cssText = 'color: #9e9e9e; font-weight: normal; font-size: 0.85em; margin-left: 4px;';
      altSpan.textContent = altName;
      heading.appendChild(sep);
      heading.appendChild(altSpan);

      // 同步更新瀏覽器分頁標題
      if (document.title && !document.title.includes(altName)) {
        const parts = document.title.split(' - ');
        if (parts.length > 1) {
          parts[0] = `${parts[0]} / ${altName}`;
          document.title = parts.join(' - ');
        }
      }
    }

    const heading = getHeadingElement();
    if (heading) {
      insertTitle(heading);
      return;
    }

    // 使用 MutationObserver 監聽直到標題出現
    const observer = new MutationObserver(() => {
      const h = getHeadingElement();
      if (h) {
        insertTitle(h);
        observer.disconnect();
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  // ── 2. 中英跨語言即時搜尋 (Cross-Language Live Search) ─────────────────────

  function hookNativeFetch() {
    if (typeof window.fetch !== 'function') return;
    const originalFetch = window.fetch;

    window.fetch = async function (resource, config) {
      const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');

      if (url && url.includes('/search/suggestions-template')) {
        const isCurrentTw = isTwLocale();
        const altUrl = isCurrentTw
          ? url.replace('/tw/search/suggestions-template', '/search/suggestions-template')
          : (url.includes('/search/suggestions-template')
              ? url.replace('/search/suggestions-template', '/tw/search/suggestions-template')
              : url);

        if (altUrl !== url) {
          try {
            const [primaryRes, altRes] = await Promise.allSettled([
              originalFetch.call(window, resource, config),
              originalFetch.call(window, altUrl, config),
            ]);

            const primaryData = primaryRes.status === 'fulfilled' && primaryRes.value.ok
              ? await primaryRes.value.clone().json()
              : null;
            const altData = altRes.status === 'fulfilled' && altRes.value.ok
              ? await altRes.value.clone().json()
              : null;

            const primaryResults = (primaryData && primaryData.results) || [];
            const altResults = (altData && altData.results) || [];

            const seen = new Set();
            const merged = [];

            // 1. 主要語言結果
            for (const item of primaryResults) {
              const key = `${item.type}-${item.id}`;
              if (!seen.has(key)) {
                seen.add(key);
                merged.push(item);
              }
            }

            // 2. 合併另一語言結果
            for (const item of altResults) {
              const key = `${item.type}-${item.id}`;
              if (!seen.has(key)) {
                seen.add(key);
                if (item.url) {
                  if (isCurrentTw && !item.url.startsWith('/tw/')) {
                    item.url = '/tw' + (item.url.startsWith('/') ? item.url : '/' + item.url);
                  } else if (!isCurrentTw && item.url.startsWith('/tw/')) {
                    item.url = item.url.replace(/^\/tw/, '');
                  }
                }
                merged.push(item);
              }
            }

            const finalPayload = {
              search: (primaryData && primaryData.search) || (altData && altData.search) || '',
              results: merged,
            };

            return new Response(JSON.stringify(finalPayload), {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (_) {
            // fallback to original fetch on error
          }
        }
      }

      return originalFetch.apply(this, arguments);
    };
  }

  // ── 初始化 ────────────────────────────────────────────────────────────────

  hookNativeFetch();
  applyDualTitle();
})();
