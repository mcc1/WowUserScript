/**
 * Wowhead Traditional Chinese Helper Library (WowheadTwHelper)
 * @version 1.6.0
 * @description Shared library for UserScripts to localize Wowhead links, tooltips, and handle SPA dynamic updates safely.
 * @license MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WowheadTwHelper = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  const WOWHEAD_HOST = /(?:^|\.)wowhead\.com$/i;
  const WOWHEAD_LOCALE_SEGMENTS = new Set([
    'www', 'en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ko', 'cn', 'tw',
  ]);
  const TW_LOCALE = 'tw';
  const WOWHEAD_ITEM_OR_SPELL_LINK = 'a[href*="wowhead.com"][href*="item="],a[href*="wowhead.com"][href*="spell="],a[href*="wowhead.com"][href*="currency="],a[href*="wowhead.com"][href*="/item/"],a[href*="wowhead.com"][href*="/spell/"],a[href*="wowhead.com"][href*="/currency/"]';

  // 1. 全域語系與 Wowhead Tooltip 設定
  //    刻意「不」在函式庫載入時自動執行 —— 呼叫端可能在讀取偏好設定後決定不啟用翻譯，
  //    若在此處就覆寫 window.Locale / whTooltips，使用者關掉翻譯仍會被強制切成 zh-TW。
  //    改由 constructor 的 autoInit（預設 true）觸發，或呼叫端自行呼叫靜態方法。
  function setupGlobalLocale() {
    if (typeof window === 'undefined') return;

    window.Locale = {
      getId: function () { return 10; },
      getName: function () { return 'zhtw'; },
    };

    if (typeof window.whTooltips === 'undefined') {
      window.whTooltips = {};
    }
    window.whTooltips.colorLinks = window.whTooltips.colorLinks !== false;
    window.whTooltips.locale = 'zhtw';
    window.whTooltips.domain = 'tw';
  }

  class WowheadTwHelper {
    /**
     * @param {Object} options
     * @param {boolean} [options.autoInit=true] - 自動初始化環境
     * @param {boolean} [options.enableRenameLinks=true] - 自動為符合條件的連結加上 data-wh-rename-link="true"
     * @param {boolean} [options.enableSafeLinkify=false] - 是否開啟純文字裝備名稱自動超連結化
     * @param {string[]} [options.excludedPanelKeywords] - 面板標題排除關鍵字（預設包含 summary, 總覽 等）
     * @param {Function} [options.onScan] - DOM 掃描回呼 (root) => void
     * @param {Function} [options.onUrlChange] - 網址變更回呼 (url) => void
     */
    constructor(options = {}) {
      this.options = Object.assign(
        {
          autoInit: true,
          enableRenameLinks: true,
          enableSafeLinkify: false,
          excludedPanelKeywords: ['summary', '總覽', 'bonus roll', '好運符', 'boss summary', 'dungeon summary'],
          onScan: null,
          onUrlChange: null,
        },
        options
      );

      this.nonItemNames = new Set();
      this.dungeonKeys = new Set();
      this.gameNameLookup = null;
      this.wowheadRefreshTimer = null;
      this.wowheadRefreshRetries = 0;
      this.maxWowheadRetries = 30;
      this.pendingRoots = new Set();
      this.flushTimer = null;
      this.lastUrl = typeof location !== 'undefined' ? location.href : '';
      this.observer = null;
      this.isStarted = false;

      if (this.options.autoInit) {
        setupGlobalLocale();
      }
    }

    /**
     * 註冊非物品名稱集合（如首領名、介面文字等），避免被誤判為物品名稱
     * @param {string[]|Set<string>} names
     */
    registerNonItemNames(names) {
      if (!names) return;
      for (const name of names) {
        if (typeof name === 'string' && name.trim()) {
          this.nonItemNames.add(name.trim().toLowerCase());
        }
      }
    }

    /**
     * 註冊地城/團本名稱對照表
     * @param {Object|string[]} dungeons
     */
    registerDungeonMap(dungeons) {
      if (!dungeons) return;
      if (Array.isArray(dungeons)) {
        for (const item of dungeons) {
          if (typeof item === 'string' && item.trim()) {
            this.dungeonKeys.add(item.trim().toLowerCase());
          }
        }
      } else if (typeof dungeons === 'object') {
        for (const key of Object.keys(dungeons)) {
          this.dungeonKeys.add(key.trim().toLowerCase());
        }
      }
    }

    /**
     * 註冊遊戲資料（副本／團本／首領）的繁中查表函式。
     *
     * 遊戲資料的譯名一律不手寫：由 tools/generate-game-names.mjs 依暴雪官方
     * Journal API（locale=zh_TW）產生 libs/game-names-tw.js，這裡只接一個
     * (englishName) => string|null 的查詢函式。
     *
     * @param {(englishName: string) => (string|null)} lookup
     */
    registerGameNameLookup(lookup) {
      this.gameNameLookup = typeof lookup === 'function' ? lookup : null;
    }

    /**
     * @param {string} englishName
     * @returns {string|null} 官方繁中名，查不到則為 null
     */
    resolveGameName(englishName) {
      if (!this.gameNameLookup || !englishName) return null;
      try {
        return this.gameNameLookup(englishName) || null;
      } catch (_) {
        return null;
      }
    }

    /**
     * 將 Wowhead 網址正規化為繁中（tw.wowhead.com）
     * @param {string} hrefLike
     * @returns {string|null}
     */
    toTwWowheadUrl(hrefLike) {
      let url;
      try {
        url = new URL(hrefLike, typeof window !== 'undefined' ? window.location.href : 'https://www.wowhead.com');
      } catch (_) {
        return null;
      }
      if (!WOWHEAD_HOST.test(url.hostname)) {
        return null;
      }

      url.protocol = 'https:';

      const hostParts = url.hostname.toLowerCase().split('.');
      const sub = hostParts.length > 2 ? hostParts[0] : '';
      if (['classic', 'tbc', 'wotlk', 'cata', 'mop', 'ptr', 'ptr-2', 'beta'].includes(sub)) {
        url.hostname = `${sub}.wowhead.com`;
      } else {
        url.hostname = 'tw.wowhead.com';
      }

      // 清除路徑中殘留的語系前綴（例如 /tw/item=... 轉回 /item=...）
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0 && WOWHEAD_LOCALE_SEGMENTS.has(segments[0].toLowerCase())) {
        segments.shift();
      }

      url.pathname = '/' + segments.join('/');
      return url.toString();
    }

    /**
     * 確保 data-wowhead 屬性包含 domain=tw
     * @param {Element} link
     * @returns {boolean}
     */
    applyTwDomainToDataWowhead(link) {
      const raw = link.getAttribute('data-wowhead');
      if (!raw) return false;

      const parts = raw.split('&').filter(Boolean);
      let changed = false;
      let found = false;
      for (let i = 0; i < parts.length; i += 1) {
        if (/^domain=/i.test(parts[i])) {
          found = true;
          if (parts[i] !== 'domain=' + TW_LOCALE) {
            parts[i] = 'domain=' + TW_LOCALE;
            changed = true;
          }
        }
      }
      if (!found) {
        parts.push('domain=' + TW_LOCALE);
        changed = true;
      }
      if (changed) {
        link.setAttribute('data-wowhead', parts.join('&'));
      }
      return changed;
    }

    /**
     * 排程觸發 Wowhead Widget 的 refreshLinks
     */
    queueWowheadRefresh() {
      if (this.wowheadRefreshTimer !== null) return;

      this.wowheadRefreshTimer = window.setTimeout(() => {
        this.wowheadRefreshTimer = null;
        const wowheadPower = window.$WowheadPower;
        if (wowheadPower && typeof wowheadPower.refreshLinks === 'function') {
          this.wowheadRefreshRetries = 0;
          wowheadPower.refreshLinks();
        } else if (this.wowheadRefreshRetries < this.maxWowheadRetries) {
          this.wowheadRefreshRetries += 1;
          this.queueWowheadRefresh();
        }
      }, 80);
    }

    /**
     * 補丁指定節點下的所有 Wowhead 連結
     * @param {Document|Element} root
     * @returns {boolean}
     */
    patchWowheadLinks(root = document) {
      const links = [];
      if (root instanceof HTMLAnchorElement) {
        links.push(root);
      }
      if (root instanceof Document || root instanceof Element) {
        for (const link of root.querySelectorAll('a[href*="wowhead.com"]')) {
          links.push(link);
        }
      }

      let touched = false;
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (!/(?:\/item(?:=|\/)|\/spell(?:=|\/)|\/currency(?:=|\/))/.test(href)) {
          continue;
        }

        const newHref = this.toTwWowheadUrl(href);
        if (!newHref) continue;

        if (newHref !== href) {
          link.setAttribute('href', newHref);
          touched = true;
        }

        if (this.applyTwDomainToDataWowhead(link)) {
          touched = true;
        }

        if (this.options.enableRenameLinks) {
          const isItemLink = /\/item(?:=|\/)/.test(newHref);
          const isSpellLink = /\/spell(?:=|\/)/.test(newHref);
          const isCurrencyLink = /\/currency(?:=|\/)/.test(newHref);
          const hasText = (link.textContent || '').trim().length > 0;
          const hasImage = link.querySelector('img') !== null;
          if ((isItemLink || isSpellLink || isCurrencyLink) && hasText && !hasImage && link.dataset.whRenameLink !== 'true') {
            link.dataset.whRenameLink = 'true';
            link.setAttribute('data-wh-rename-link', 'true');
            touched = true;
          }
        }
      }

      if (touched) {
        this.queueWowheadRefresh();
      }
      return touched;
    }

    /**
     * 檢查文字是否可能為未翻譯的英文裝備/附魔名稱
     * @param {string} text
     * @returns {boolean}
     */
    isLikelyItemOrEnchantName(text) {
      if (!text) return false;
      const value = text.trim();
      if (value.length < 2 || value.length > 80) return false;

      const lower = value.toLowerCase();
      if (this.nonItemNames.has(lower)) return false;
      if (this.dungeonKeys.has(lower)) return false;
      // 副本／團本／首領名稱不是裝備名，避免被誤判成物品而超連結化
      if (this.resolveGameName(value)) return false;

      // 含有中文字元代表已經是繁中，不需再處理
      if (/[\u4e00-\u9fa5]/.test(value)) return false;
      if (!/[A-Za-z]/.test(value)) return false;
      if (/[<>{}\\]/.test(value)) return false;

      return true;
    }

    /**
     * 檢查元素是否位於 Summary 或不需要進行 Linkify 的面板內
     * @param {Element} element
     * @returns {boolean}
     */
    isInsideExcludedPanel(element) {
      let current = element;
      while (current && current !== document.body) {
        if (current instanceof Element) {
          if (current.classList.contains('Panel')) {
            const heading = current.querySelector('.PanelHeader .Heading, .PanelHeader h1, .PanelHeader h2, .PanelHeader h3, .PanelHeader h4, .PanelHeader h5, .PanelHeader h6, [class*="PanelHeader"]');
            if (heading) {
              const text = (heading.textContent || '').trim().toLowerCase();
              for (const kw of this.options.excludedPanelKeywords) {
                if (text.includes(kw.toLowerCase())) {
                  return true;
                }
              }
            }
          }
          if (
            current.classList.contains('SummaryRow') ||
            current.classList.contains('BonusRollRow')
          ) {
            return true;
          }
        }
        current = current.parentElement;
      }
      return false;
    }

    /**
     * 尋找文字節點周圍唯一的 Wowhead 圖示連結
     * @param {Element} textElement
     * @returns {HTMLAnchorElement|null}
     */
    findNearestWowheadIconLink(textElement) {
      // 0. 超優先：檢查文字節點直接同層或直接父容器內緊鄰的專屬圖示（例如附魔卷軸、特定法術/通貨圖示）
      const immediateParent = textElement.parentElement;
      if (immediateParent instanceof Element) {
        const directImg = immediateParent.querySelector('img[src*="/id/item/"], img[src*="/id/spell/"], img[src*="/id/currency/"]');
        if (directImg) {
          const m = (directImg.getAttribute('src') || '').match(/\/id\/(item|spell|currency)\/(\d+)\.png/);
          if (m) {
            const fakeLink = document.createElement('a');
            fakeLink.setAttribute('href', `//tw.wowhead.com/${m[1]}=${m[2]}`);
            return fakeLink;
          }
        }
        const directLink = immediateParent.querySelector(WOWHEAD_ITEM_OR_SPELL_LINK);
        if (directLink instanceof HTMLAnchorElement && !directLink.contains(textElement) && !textElement.contains(directLink)) {
          return directLink;
        }
      }

      // 1. 優先透過 closest 判定是否位於明確的單一裝備卡片/行中（支援帶插槽寶石與 noLink: true 的裝備）
      const itemCard =
        typeof textElement.closest === 'function'
          ? textElement.closest(
              '[data-testid^="droptimizer-item-"], [data-testid^="item-option-"], .DroptimizerRow, .ItemOption, [class*="droptimizerItem"], [class*="DroptimizerRow"], div.item, [id$="/item"]'
            )
          : null;

      if (itemCard) {
        const links = itemCard.querySelectorAll(WOWHEAD_ITEM_OR_SPELL_LINK);
        for (const link of links) {
          if (!(link instanceof HTMLAnchorElement)) continue;
          if (link.contains(textElement) || textElement.contains(link)) continue;
          if (link.dataset.twWowheadLinked === 'true') continue;
          // 單一卡片內的第一個有效 Wowhead 連結必為裝備本體（後續為鑲嵌的插槽寶石）
          return link;
        }

        // 支援 Top Gear 等使用 noLink: true 的裝備卡片（從 img.src 提取 itemId/currencyId）
        const img = itemCard.querySelector('img[src*="/id/item/"], img[src*="/id/spell/"], img[src*="/id/currency/"]');
        if (img) {
          const m = (img.getAttribute('src') || '').match(/\/id\/(item|spell|currency)\/(\d+)\.png/);
          if (m) {
            const fakeLink = document.createElement('a');
            fakeLink.setAttribute('href', `//tw.wowhead.com/${m[1]}=${m[2]}`);
            return fakeLink;
          }
        }
      }

      // 2. 常規向上回溯祖先（用於無特定 class 的自訂表格/圖表視圖）
      let ancestor = textElement;
      for (let depth = 0; depth < 5 && ancestor; depth += 1) {
        ancestor = ancestor.parentElement;
        if (!(ancestor instanceof Element)) continue;

        const links = ancestor.querySelectorAll(WOWHEAD_ITEM_OR_SPELL_LINK);
        const mainLinks = [];
        for (const link of links) {
          if (!(link instanceof HTMLAnchorElement)) continue;
          if (link.contains(textElement) || textElement.contains(link)) continue;
          if (link.dataset.twWowheadLinked === 'true') continue;
          mainLinks.push(link);
        }

        // 如果這個祖先節點內還沒有包含圖示，繼續往上層祖先搜尋
        if (mainLinks.length === 0) continue;

        // 如果這個祖先節點內包含多於 1 個裝備圖示（如好運符/地城總覽清單行），
        // 該列文字為地城/首領名稱，絕對不可關聯！直接返回 null
        if (mainLinks.length > 1) return null;

        // 恰好只有 1 個裝備圖示，成功找到唯一對應的物品圖示
        return mainLinks[0];
      }
      return null;
    }

    /**
     * 將純文字物品名稱安全轉為超連結
     * @param {Element} nameElement
     * @param {HTMLAnchorElement} iconLink
     * @returns {boolean}
     */
    linkifyNameElement(nameElement, iconLink) {
      if (nameElement.closest('a')) return false;
      if (nameElement.dataset.twWowheadLinked === 'true') return false;

      const href = iconLink.getAttribute('href');
      if (!href || !/wowhead\.com\//i.test(href)) return false;

      const twHref = this.toTwWowheadUrl(href) || href;
      const originalText = (nameElement.textContent || '').trim();
      if (!this.isLikelyItemOrEnchantName(originalText)) return false;

      const anchor = document.createElement('a');
      anchor.setAttribute('href', twHref);
      anchor.setAttribute('rel', 'noopener');
      anchor.setAttribute('target', '_blank');
      anchor.dataset.whRenameLink = 'true';
      anchor.setAttribute('data-wh-rename-link', 'true');
      anchor.style.color = 'inherit';
      anchor.style.textDecoration = 'none';
      anchor.textContent = originalText;

      const dataWowhead = iconLink.getAttribute('data-wowhead');
      if (dataWowhead) {
        anchor.setAttribute('data-wowhead', dataWowhead);
        this.applyTwDomainToDataWowhead(anchor);
      }

      nameElement.textContent = '';
      nameElement.appendChild(anchor);
      nameElement.dataset.twWowheadLinked = 'true';
      return true;
    }

    /**
     * 掃描並超連結化鄰近純文字裝備名稱
     * @param {Document|Element} root
     * @returns {boolean}
     */
    linkifyNearbyItemNames(root = document) {
      if (!this.options.enableSafeLinkify) return false;

      const scope = root instanceof Document ? root.body : root;
      if (!(scope instanceof Element)) return false;

      const candidates = [];
      if (scope.matches('p,span,div')) {
        candidates.push(scope);
      }
      for (const node of scope.querySelectorAll('p,span,div')) {
        candidates.push(node);
      }
      let touched = false;

      for (const candidate of candidates) {
        if (!(candidate instanceof Element)) continue;
        if (candidate.childElementCount !== 0) continue;
        if (candidate.closest('a,button,label,textarea,select,[role="button"]')) continue;
        if (candidate.closest('h1,h2,h3,h4,h5,h6,thead,th,caption,[role="heading"],[role="columnheader"]')) continue;
        if (this.isInsideExcludedPanel(candidate)) continue;
        if (candidate.classList.contains('Tooltip_box')) continue;
        if (candidate.dataset.twWowheadLinked === 'true') continue;

        const text = (candidate.textContent || '').trim();
        if (!this.isLikelyItemOrEnchantName(text)) continue;

        const iconLink = this.findNearestWowheadIconLink(candidate);
        if (!iconLink) continue;

        if (this.linkifyNameElement(candidate, iconLink)) {
          touched = true;
        }
      }
      return touched;
    }

    /**
     * 將節點加入處理佇列（批次防抖執行）
     * @param {Node} root
     */
    queueRoot(root) {
      if (!root) return;
      let target = root;
      if (target instanceof Document) {
        target = target.body;
      } else if (target.nodeType === Node.TEXT_NODE) {
        target = target.parentElement;
      }
      if (!(target instanceof Element)) return;

      this.pendingRoots.add(target);
      if (this.flushTimer !== null) return;

      this.flushTimer = window.setTimeout(() => this.flushPendingRoots(), 160);
    }

    flushPendingRoots() {
      this.flushTimer = null;
      const roots = Array.from(this.pendingRoots);
      this.pendingRoots.clear();

      let linkifyTouched = false;
      for (const root of roots) {
        if (!document.body || !document.contains(root)) continue;

        if (this.linkifyNearbyItemNames(root)) {
          linkifyTouched = true;
        }

        if (typeof this.options.onScan === 'function') {
          this.options.onScan(root);
        }

        this.patchWowheadLinks(root);
      }

      if (linkifyTouched) {
        this.patchWowheadLinks(document);
      }
    }

    runFullPass() {
      if (!document.body) return;
      this.queueRoot(document.body);
    }

    onUrlChange(force = false) {
      const currentUrl = location.href;
      if (!force && currentUrl === this.lastUrl) return;

      this.lastUrl = currentUrl;
      if (typeof this.options.onUrlChange === 'function') {
        this.options.onUrlChange(currentUrl);
      }

      this.runFullPass();
      setTimeout(() => this.runFullPass(), 300);
      setTimeout(() => this.runFullPass(), 900);
      setTimeout(() => this.runFullPass(), 1800);
    }

    /**
     * 相容別名
     */
    observe() {
      this.start();
    }

    startHistoryListener() {
      // History listener is automatically handled by start()
    }

    /**
     * 啟動監聽與自動處理
     */
    start() {
      if (this.isStarted) return;
      this.isStarted = true;

      const handleReady = () => {
        this.runFullPass();
        setTimeout(() => this.runFullPass(), 350);
        setTimeout(() => this.runFullPass(), 1000);
        setTimeout(() => this.runFullPass(), 2200);

        this.observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              for (const added of mutation.addedNodes) {
                if (added.nodeType === Node.ELEMENT_NODE || added.nodeType === Node.TEXT_NODE) {
                  this.queueRoot(added);
                }
              }
            } else if (mutation.type === 'characterData') {
              this.queueRoot(mutation.target);
            } else if (mutation.type === 'attributes') {
              const target = mutation.target;
              if (target instanceof Element) {
                this.queueRoot(target);
                if (mutation.attributeName === 'href') {
                  this.patchWowheadLinks(target);
                }
              }
            }
          }
        });

        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['href', 'title', 'aria-label', 'placeholder', 'value'],
        });
      };

      if (!document.body) {
        document.addEventListener('DOMContentLoaded', handleReady, { once: true });
      } else {
        handleReady();
      }

      // SPA 導航攔截
      const rawPushState = history.pushState.bind(history);
      const self = this;
      history.pushState = function (...args) {
        const result = rawPushState(...args);
        self.onUrlChange();
        return result;
      };

      const rawReplaceState = history.replaceState.bind(history);
      history.replaceState = function (...args) {
        const result = rawReplaceState(...args);
        self.onUrlChange();
        return result;
      };

      window.addEventListener('popstate', () => this.onUrlChange());
      window.addEventListener('hashchange', () => this.onUrlChange());
    }
  }

  /**
   * 覆寫 window.Locale / window.whTooltips 為 zh-TW。
   * 建立實例時（autoInit 預設 true）會自動呼叫，一般不需手動使用。
   */
  WowheadTwHelper.setupGlobalLocale = setupGlobalLocale;

  return WowheadTwHelper;
});
