/**
 * Wowhead Traditional Chinese Helper Library (WowheadTwHelper)
 * @version 1.0.0
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
  const WOWHEAD_ITEM_OR_SPELL_LINK = 'a[href*="wowhead.com"][href*="item="],a[href*="wowhead.com"][href*="spell="],a[href*="wowhead.com"][href*="/item/"],a[href*="wowhead.com"][href*="/spell/"]';

  // 1. 全域語系與 Wowhead Tooltip 設定（立即執行）
  function setupGlobalLocale() {
    if (typeof window === 'undefined') return;

    if (!window.Locale) {
      window.Locale = {
        getId: function () { return 10; },
        getName: function () { return 'zhtw'; },
      };
    }

    if (typeof window.whTooltips === 'undefined') {
      window.whTooltips = {};
    }
    window.whTooltips.colorLinks = window.whTooltips.colorLinks !== false;
    window.whTooltips.locale = 'zhtw';
    window.whTooltips.domain = 'tw';
  }

  setupGlobalLocale();

  function getRectCenter(rect) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
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
        if (!/(?:\/item(?:=|\/)|\/spell(?:=|\/))/.test(href)) {
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
          const hasText = (link.textContent || '').trim().length > 0;
          const hasImage = link.querySelector('img') !== null;
          if ((isItemLink || isSpellLink) && hasText && !hasImage && link.dataset.whRenameLink !== 'true') {
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
      if (value.length < 4 || value.length > 64) return false;

      const lower = value.toLowerCase();
      if (this.nonItemNames.has(lower)) return false;
      if (this.dungeonKeys.has(lower)) return false;

      // 含有中文字元代表已經被翻譯，絕不可再被 Wowhead rename 覆蓋
      if (/[\u4e00-\u9fa5]/.test(value)) return false;
      if (!/[A-Za-z]/.test(value)) return false;
      if (/[0-9:/()[\]{}]/.test(value)) return false;
      if (/^[a-z\s'-]+$/.test(value)) return false;

      const words = value.split(/\s+/).filter(Boolean);
      if (words.length > 10) return false;

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
      let ancestor = textElement;
      for (let depth = 0; depth < 5 && ancestor; depth += 1) {
        ancestor = ancestor.parentElement;
        if (!(ancestor instanceof Element)) continue;

        const isItemCard =
          (typeof ancestor.matches === 'function' &&
            ancestor.matches('[data-testid^="droptimizer-item-"], [data-testid^="item-option-"]')) ||
          ancestor.classList.contains('DroptimizerRow') ||
          ancestor.classList.contains('ItemOption');

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

        // 如果是已知的單一裝備卡片（可能附帶 1~3 顆插槽寶石），第一個連結永遠是裝備本體！
        if (isItemCard) {
          return mainLinks[0];
        }

        // 如果不是單一卡片，且祖先節點內包含多於 1 個裝備圖示（如好運符/地城總覽清單行），
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

      let scope = nameElement.parentElement;
      for (let depth = 0; depth < 4 && scope; depth += 1) {
        const existingAnchors = scope.querySelectorAll('a[data-wh-rename-link="true"]');
        for (const existing of existingAnchors) {
          if (
            existing !== iconLink &&
            !nameElement.contains(existing) &&
            existing.getAttribute('href') === twHref
          ) {
            return false;
          }
        }
        scope = scope.parentElement;
      }

      const anchor = document.createElement('a');
      anchor.setAttribute('href', twHref);
      anchor.setAttribute('rel', 'noopener');
      anchor.setAttribute('target', '_blank');
      anchor.dataset.whRenameLink = 'true';
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

  return WowheadTwHelper;
});
