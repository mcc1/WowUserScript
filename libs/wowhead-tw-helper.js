/**
 * Wowhead Traditional Chinese Helper Library (WowheadTwHelper)
 * @version 1.10.1
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
  // Wowhead widget 在 tooltip 資料還沒回來時，會先把連結文字改寫成字串
  // "undefined"（偶爾是 "null"）。那不是譯名 —— 探針收下去就直接寫進畫面，
  // 使用者看到的是一個大大的 undefined，比留著英文還糟。當成「還沒好」重試即可，
  // 資料到了下一輪就是正確的名稱（2026-10-17 在 raidbots 報告上實際踩到：
  // 11 筆品名有 6 筆變成 undefined，重新整理後又正常，是競態不是資料缺漏）。
  const INVALID_PROBE_TEXTS = new Set(['undefined', 'null']);
  const LINKIFY_SKIP_SELECTOR = 'script,style,noscript,textarea,input,option,code,pre,kbd,samp,[contenteditable]';
  const INTERACTIVE_MENU_SELECTOR = '.DropdownMenu,[role="menu"],[role="listbox"]';
  const ITEM_CARD_SELECTOR = '[data-test="actor-compare-row"], [data-testid^="droptimizer-item-"], [data-testid^="item-option-"], .DroptimizerRow, .ItemOption, [class*="droptimizerItem"], [class*="DroptimizerRow"], div.item, [id$="/item"]';

  function getPageWindow() {
    if (typeof unsafeWindow !== 'undefined') return unsafeWindow;
    return typeof window !== 'undefined' ? window : globalThis;
  }

  // 1. 全域語系與 Wowhead Tooltip 設定
  //    刻意「不」在函式庫載入時自動執行 —— 呼叫端可能在讀取偏好設定後決定不啟用翻譯，
  //    若在此處就覆寫 window.Locale / whTooltips，使用者關掉翻譯仍會被強制切成 zh-TW。
  //    改由 constructor 的 autoInit（預設 true）觸發，或呼叫端自行呼叫靜態方法。
  function setupGlobalLocale() {
    const pageWindow = getPageWindow();
    if (!pageWindow) return;

    pageWindow.Locale = {
      getId: function () { return 10; },
      getName: function () { return 'zhtw'; },
    };

    if (typeof pageWindow.whTooltips === 'undefined') {
      pageWindow.whTooltips = {};
    }
    pageWindow.whTooltips.colorLinks = pageWindow.whTooltips.colorLinks !== false;
    pageWindow.whTooltips.locale = 'zhtw';
    pageWindow.whTooltips.domain = 'tw';
  }

  class WowheadTwHelper {
    /**
     * @param {Object} options
     * @param {boolean} [options.autoInit=true] - 自動初始化環境
     * @param {boolean} [options.enableRenameLinks=true] - 自動為符合條件的連結加上 data-wh-rename-link="true"
     * @param {boolean} [options.enableSafeLinkify=false] - 是否開啟純文字裝備名稱自動超連結化
     * @param {boolean} [options.enableTextOnlyRename=false] - 是否只翻譯純文字裝備名稱，不建立可點擊連結（與 enableSafeLinkify 擇一）
     * @param {boolean} [options.enableIconLinkRename=false] - 用探針翻譯「圖示與名稱同在一個連結內」的情況
     * @param {boolean} [options.syncSmallMutations=false] - 小批變動同步翻譯，消除站方重繪造成的閃爍
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
          enableTextOnlyRename: false,
          enableIconLinkRename: false,
          syncSmallMutations: false,
          excludedPanelKeywords: ['summary', '總覽', 'bonus roll', '好運符', 'boss summary', 'dungeon summary'],
          onScan: null,
          onUrlChange: null,
        },
        options
      );

      this.nonItemNames = new Set();
      this.nonItemNameChecks = [];
      this.dungeonKeys = new Set();
      this.gameNameLookup = null;
      this.wowheadRefreshTimer = null;
      this.wowheadRefreshRetries = 0;
      this.maxWowheadRetries = 30;
      this.maxRenameProbeAttempts = 20;
      this.textRenameClaims = new WeakMap();
      // 一批變動帶進來多少節點以內算「小批」，可以同步處理。實測 archon 的 hover
      // 重繪是 10 個文字節點；路由切換帶進來的是整個頁面，遠遠超過。
      this.syncFlushMaxNodes = 50;
      this.pendingRoots = new Set();
      this.flushTimer = null;
      const pageWindow = getPageWindow();
      this.lastUrl = pageWindow && pageWindow.location ? pageWindow.location.href : '';
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
     * 註冊「這段文字是站台 UI 字串」的判斷函式。
     *
     * 站台自己產生的字串不一定能逐字列舉（raidbots 的「3 variations hidden」
     * 數字會變），字典列不到就會被探針當成裝備名改寫掉；而且探針跑在翻譯之前，
     * 使用者看到的是物品名而不是譯文。呼叫端把自己的 translateText 包成判斷函式
     * 傳進來，字典翻得動的字串一律不當裝備名。
     * @param {(text: string) => boolean} check
     */
    registerNonItemNameCheck(check) {
      if (typeof check === 'function') {
        this.nonItemNameChecks.push(check);
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
        const pageWindow = getPageWindow();
        url = new URL(hrefLike, pageWindow && pageWindow.location ? pageWindow.location.href : 'https://www.wowhead.com');
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
        const wowheadPower = getPageWindow().$WowheadPower;
        if (wowheadPower && typeof wowheadPower.refreshLinks === 'function') {
          this.wowheadRefreshRetries = 0;
          // power.js 在所有全域功能都關閉時會直接跳過掃描；true 只強制進入
          // refresh pass，實際是否改名仍由每條連結的 data-wh-rename-link 決定。
          wowheadPower.refreshLinks(true);
        } else if (this.wowheadRefreshRetries < this.maxWowheadRetries) {
          this.wowheadRefreshRetries += 1;
          this.queueWowheadRefresh();
        }
      }, 80);
    }

    /**
     * 找出連結內裝著「名稱」的那個文字節點。
     * 圖示沒有文字、使用率徽章只有數字與 %，所以取字母最多的那個文字節點即可。
     * @param {Element} link
     * @returns {Text|null}
     */
    findNameTextNode(link) {
      const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
      let best = null;
      let bestLength = 0;
      let node;

      while ((node = walker.nextNode())) {
        const text = node.textContent.trim();
        if (!/[A-Za-z]{2}/.test(text)) continue;
        if (text.length > bestLength) {
          best = node;
          bestLength = text.length;
        }
      }
      return best;
    }

    /**
     * 翻譯「圖示、數據與名稱同在一個連結內」的情況。
     *
     * 這種連結不能直接掛 data-wh-rename-link —— Wowhead widget 是把整個
     * innerHTML 換成 <span>名稱</span>，圖示與數據會一起消失。實測結構：
     *
     *     <a href="/spell=1286970">
     *       <div><img></div>                       圖示
     *       <div class="percentage_badge">82.9%</div>   使用率
     *       <span>Rune of Unleashed Fire</span>    名稱
     *     </a>
     *
     * 所以改用探針：另外造一個隱藏連結讓 widget 去改寫，讀出譯名後只寫回原
     * 連結裡放名稱的那個文字節點，原連結全程不掛改名標記。
     *
     * @param {Document|Element} root
     */
    renameIconLinksByProbe(root = document) {
      if (!this.options.enableIconLinkRename || !document.body) return;

      const scope = root && root.querySelectorAll ? root : document;
      const jobs = [];

      for (const link of scope.querySelectorAll('a[href*="wowhead.com"]')) {
        if (link.dataset.twIconRenamed === 'true') continue;
        if (link.dataset.whRenameLink === 'true') continue;  // 一般路徑已經處理
        if (!link.querySelector('img')) continue;            // 沒圖示就不需要探針

        const twHref = this.toTwWowheadUrl(link.getAttribute('href') || '');
        if (!twHref || !/\/(?:item|spell|currency)(?:=|\/)/.test(twHref)) continue;

        const nameNode = this.findNameTextNode(link);
        if (!nameNode) continue;

        const original = nameNode.textContent.trim();
        if (!original || this.nonItemNames.has(original)) continue;

        const probe = document.createElement('a');
        probe.setAttribute('href', twHref);
        probe.setAttribute('data-wh-rename-link', 'true');
        probe.dataset.whRenameLink = 'true';
        probe.textContent = original;
        // 不能用 display:none —— widget 會略過不算數的節點。移到畫面外即可。
        probe.style.cssText =
          'position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(probe);

        link.dataset.twIconRenamed = 'true';
        jobs.push({ link: link, target: nameNode, probe: probe, original: original });
      }

      if (!jobs.length) return;

      this.queueWowheadRefresh();
      this.collectRenameProbes(jobs, 0);
    }

    /**
     * 輪詢探針，改名到了就寫回原連結。逾時的探針一定要移除，否則會在 DOM 裡累積。
     * @param {Array} jobs
     * @param {number} attempt
     */
    collectRenameProbes(jobs, attempt) {
      window.setTimeout(() => {
        const pending = [];

        for (const job of jobs) {
          const renamed = (job.probe.textContent || '').trim();

          const target = job.target;
          if (renamed && renamed !== job.original && !INVALID_PROBE_TEXTS.has(renamed.toLowerCase())) {
            if (target && target.isConnected && target.textContent.indexOf(job.original) !== -1) {
              target.textContent = target.textContent.replace(job.original, renamed);
            }
            job.probe.remove();
            if (job.nameElement) {
              delete job.nameElement.dataset.twWowheadRenaming;
              job.nameElement.dataset.twWowheadTextRenameSource = job.original;
              job.nameElement.dataset.twWowheadTextRenameResult = renamed;
            }
            if (job.claim) {
              job.claim.pending = false;
              job.claim.translated = renamed;
            }
          } else {
            pending.push(job);
          }
        }

        if (pending.length && attempt < this.maxRenameProbeAttempts) {
          this.collectRenameProbes(pending, attempt + 1);
          return;
        }

        for (const job of pending) {
          job.probe.remove();
          if (job.link) delete job.link.dataset.twIconRenamed;
          if (job.nameElement) delete job.nameElement.dataset.twWowheadRenaming;
          if (job.card && job.claim && job.claimSet) {
            job.claimSet.delete(job.claim);
            if (!job.claimSet.size) {
              const claims = this.textRenameClaims.get(job.card);
              if (claims && claims.get(job.twHref) === job.claimSet) claims.delete(job.twHref);
            }
          }
        }
      }, 250);
    }

    /**
     * 翻譯站方刻意不提供連結的純文字物品名稱。
     *
     * Raidbots 的 Top Gear 與 Droptimizer 會在部分卡片上使用 noLink: true：
     * 圖示可以觸發 Wowhead tooltip，但名稱本身不是可點擊連結。這裡沿用
     * 隱藏 probe 取得 Wowhead 的繁中名稱，只回寫原文字節點，不改變站方互動。
     * @param {Document|Element} root
     */
    renameTextOnlyNamesByProbe(root = document) {
      if (!this.options.enableTextOnlyRename || !document.body) return;

      const scope = root && root.querySelectorAll ? root : document;
      const candidates = [];
      if (scope.matches && scope.matches('p,span,div')) {
        candidates.push(scope);
      }
      for (const node of scope.querySelectorAll('p,span,div')) {
        candidates.push(node);
      }

      const jobs = [];
      for (const candidate of candidates) {
        if (!(candidate instanceof Element)) continue;
        if (candidate.childElementCount !== 0) continue;
        if (candidate.closest('a,button,label,textarea,select,[role="button"]')) continue;
        if (candidate.closest(LINKIFY_SKIP_SELECTOR)) continue;
        if (candidate.closest('h1,h2,h3,h4,h5,h6,thead,th,caption,[role="heading"],[role="columnheader"]')) continue;
        if (candidate.classList.contains('Tooltip_box')) continue;
        if (candidate.dataset.twWowheadRenaming === 'true') continue;

        const original = (candidate.textContent || '').trim();
        if (!this.isLikelyItemOrEnchantName(original)) continue;
        if (/[:：]\s*$/.test(original)) continue;

        if (candidate.dataset.twWowheadTextRenameResult === original) continue;

        const itemCard = candidate.closest(ITEM_CARD_SELECTOR);
        const iconLink = this.findNearestWowheadIconLink(candidate);
        if (!iconLink) continue;

        // Summary／好運符面板預設整塊跳過，只有「一列一件裝備」的列放行。
        if (this.isInsideExcludedPanel(candidate) && !this.isSingleItemRow(candidate, iconLink)) continue;

        // Raidbots 的 Copy/Modify 選單同時包含主裝備、紋章與其他成本列。
        // 只有列內自己的圖示才是安全來源；若探針跨出選單抓到外層主裝備，
        // 就保留站方原文，避免所有成本列被改成同一件裝備。
        const menu = candidate.closest(INTERACTIVE_MENU_SELECTOR);
        if (menu && !menu.contains(iconLink)) continue;

        const twHref = this.toTwWowheadUrl(iconLink.getAttribute('href') || '');
        if (!twHref || !/\/(?:item|spell|currency)(?:=|\/)/.test(twHref)) continue;

        const isSyntheticIcon = Boolean(itemCard && !iconLink.isConnected);
        if (isSyntheticIcon) {
          // 沒有可用 Wowhead anchor 時只能從圖示 URL 猜來源；卡片內有多個
          // 圖示就無法安全知道文字屬於哪一件物品，寧可保留原文也不誤翻。
          const itemImages = itemCard.querySelectorAll(
            'img[src*="/id/item/"], img[src*="/id/spell/"], img[src*="/id/currency/"]'
          );
          if (itemImages.length !== 1) continue;
        }

        let claim = null;
        let claimSet = null;
        if (itemCard) {
          let claims = this.textRenameClaims.get(itemCard);
          if (!claims) {
            claims = new Map();
            this.textRenameClaims.set(itemCard, claims);
          }

          claimSet = claims.get(twHref);
          if (!claimSet) {
            claimSet = new Set();
            claims.set(twHref, claimSet);
          }

          let existingCandidateClaim = null;
          for (const oldClaim of Array.from(claimSet)) {
            const ownerText = oldClaim.target && oldClaim.target.isConnected
              ? (oldClaim.target.textContent || '').trim()
              : '';
            if (!oldClaim.target || !oldClaim.target.isConnected) {
              claimSet.delete(oldClaim);
            } else if (oldClaim.target === candidate) {
              if (
                (oldClaim.pending && ownerText === oldClaim.original)
                || (!oldClaim.pending && ownerText === oldClaim.translated)
              ) {
                existingCandidateClaim = oldClaim;
                break;
              }
              claimSet.delete(oldClaim);
            }
          }
          if (existingCandidateClaim) continue;
          if (!claimSet.size) {
            claims.delete(twHref);
            claimSet = null;
          }
          if (isSyntheticIcon && claimSet && claimSet.size) continue;
        }

        const probe = document.createElement('a');
        probe.setAttribute('href', twHref);
        probe.setAttribute('data-wh-rename-link', 'true');
        probe.dataset.whRenameLink = 'true';
        probe.textContent = original;

        const dataWowhead = iconLink.getAttribute('data-wowhead');
        if (dataWowhead) {
          probe.setAttribute('data-wowhead', dataWowhead);
          this.applyTwDomainToDataWowhead(probe);
        }

        // 不能用 display:none —— widget 會略過不算數的節點。移到畫面外即可。
        probe.style.cssText =
          'position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(probe);

        candidate.dataset.twWowheadRenaming = 'true';
        if (itemCard) {
          claim = { target: candidate, original: original, translated: '', pending: true };
          if (!claimSet) {
            claimSet = new Set();
            this.textRenameClaims.get(itemCard).set(twHref, claimSet);
          }
          claimSet.add(claim);
        }
        jobs.push({ nameElement: candidate, card: itemCard, claim: claim, claimSet: claimSet, target: candidate, probe: probe, original: original, twHref: twHref });
      }

      if (!jobs.length) return;

      this.queueWowheadRefresh();
      this.collectRenameProbes(jobs, 0);
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
      if (/^(?:upgrade(?:\s+cost)?|crafting\s+quality(?:\s+\d+)?)[:：]?$/i.test(value)) return false;

      // 全大寫短代碼是介面徽章（raidbots 疊在裝備圖示上的 CAT / UPG / GV / MOD…），
      // 不是裝備名 —— 真正的裝備名一定含小寫字母。若不擋掉，徽章會被 linkify 成物品
      // 連結，接著被 Wowhead widget 改寫成該物品的資料庫名稱，徽章就被整個換掉了。
      if (value.length <= 5 && !/[a-z]/.test(value)) return false;

      // Raidbots 在 Top Gear 比較列的每個圖示下面標的是附魔簡碼 + 階級
      // （Avoid2 / CritPct2 / Pri2 —— 站方 JS 的 shortName 加上附魔等級）。
      // 單一個詞尾端接數字不會是裝備名，暴雪的名稱不長這樣。不擋掉的話整列
      // 簡碼都會被改寫成那一列主裝備的名稱，蓋在圖示上。
      if (/^[A-Za-z]+\d+$/.test(value)) return false;

      for (const check of this.nonItemNameChecks) {
        try {
          if (check(value)) return false;
        } catch (error) {
          // 呼叫端的判斷函式壞掉不該讓整個掃描停擺
        }
      }

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
     * 容器裡除了目前這段文字以外，還掛著別的名稱文字嗎？
     * @param {Element} container
     * @param {Element} textElement
     * @returns {boolean}
     */
    containsOtherNameText(container, textElement) {
      for (const leaf of container.querySelectorAll('p,span,div,a')) {
        if (leaf.childElementCount !== 0) continue;
        if (leaf === textElement || leaf.contains(textElement) || textElement.contains(leaf)) continue;
        // 先用便宜的條件擋掉數字、符號、空白 —— isNameTextLeaf 會一路查到站台字典，
        // 每個連結的每一層祖先都要掃一遍葉節點，不先擋會很貴。
        const text = (leaf.textContent || '').trim();
        if (text.length < 2 || !/[A-Za-z一-龥]/.test(text)) continue;
        if (this.isNameTextLeaf(leaf)) return true;
      }
      return false;
    }

    /**
     * 這個葉節點是（或曾經是）一段名稱嗎？
     *
     * 翻完的名稱是中文，`isLikelyItemOrEnchantName` 會說它不是名稱 —— 於是附魔
     * 譯好之後，它的圖示就「沒有主人」了，同一塊裡排在後面的附加文字會接手把
     * 自己改成附魔名。看自己蓋的記號，譯過的名稱一樣算數。
     * @param {Element} leaf
     * @returns {boolean}
     */
    isNameTextLeaf(leaf) {
      const data = leaf.dataset || {};
      if (data.twWowheadTextRenameSource || data.twWowheadRenaming === 'true') return true;
      if (data.twWowheadLinked === 'true' || data.twIconRenamed === 'true') return true;
      return this.isLikelyItemOrEnchantName((leaf.textContent || '').trim());
    }

    /**
     * 這個圖示是不是已經被它自己那一組的名稱認領了？
     *
     * Raidbots 的附魔與寶石是自成一組的小單元：一個小圖示連結配一段自己的名稱。
     * 外層的裝備名稱若把這種單元裡的圖示當成來源，就會被改寫成附魔或寶石的名字
     * —— 畫面上完全合理，但那是錯的資訊（Top Gear 的「最佳配裝」清單整欄裝備名
     * 都被換成該件的附魔名，2026-10-17 回報）。
     * 從連結往上走到 container 為止，只要中途某一層同時裝著這個圖示與別的名稱
     * 文字，圖示就屬於那段文字，不是這一段的。
     * @param {HTMLAnchorElement} link
     * @param {Element} container
     * @param {Element} textElement
     * @returns {boolean}
     */
    isIconLinkClaimedByOtherName(link, container, textElement) {
      let node = link.parentElement;
      // 小單元不會深到哪裡去；限制層數免得在大容器裡逐層掃整棵樹。
      for (let depth = 0; depth < 8 && node instanceof Element && node !== container; depth += 1) {
        if (!node.contains(textElement) && this.containsOtherNameText(node, textElement)) return true;
        node = node.parentElement;
      }
      return false;
    }

    /**
     * 取出容器內可以當作「這段文字的圖示」的 Wowhead 連結
     * @param {Element} container
     * @param {Element} textElement
     * @returns {HTMLAnchorElement[]}
     */
    collectIconLinks(container, textElement, options = {}) {
      const { requirePrecedes = false, excludeWithin = null } = options;
      const links = [];
      for (const link of container.querySelectorAll(WOWHEAD_ITEM_OR_SPELL_LINK)) {
        if (!(link instanceof HTMLAnchorElement)) continue;
        if (link.contains(textElement) || textElement.contains(link)) continue;
        if (link.dataset.twWowheadLinked === 'true') continue;
        // 名稱自己那一塊裡面的圖示是掛在這件裝備上的寶石／附魔，第 1 步已經判過，
        // 往上找的時候不要再撿回來（項鍊的寶石圖示就塞在品名下面那一行）。
        if (excludeWithin instanceof Element && excludeWithin.contains(link)) continue;
        // 同一塊裡面，圖示排在名稱前面才是「這個名稱的圖示」（附魔／寶石小單元
        // 都是圖示在左、名稱在右）；排在名稱後面的是掛在它身上的東西。
        // 只在這一層成立：裝備列本身在右欄是鏡像排版，圖示反而在文字後面。
        if (requirePrecedes && !(link.compareDocumentPosition(textElement) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        if (this.isIconLinkClaimedByOtherName(link, container, textElement)) continue;
        links.push(link);
      }
      return links;
    }

    /**
     * 這段文字是不是「一列一件裝備」那種列裡唯一的名稱？
     *
     * Summary／好運符面板整塊被 `isInsideExcludedPanel` 跳過，因為那種列的文字是
     * 地城或首領名，配上列內的掉落物圖示就會變成「看起來完全合理的錯誤資訊」。
     * 但 Top Gear 的「大秘寶庫 總覽」就長在這種面板裡，而它每一列是真的一件裝備：
     * 一個物品圖示排在前面，後面接品名與「寶庫物品 · 胸部」這類說明。
     *
     * 放行條件全是形狀，不看面板標題也不列舉站台字串 —— 兩者都會隨改版漂移：
     * - 圖示必須是物品連結（好運符列的圖示另外掛通貨徽章，那一列就有兩個目標）
     * - 圖示排在名稱前面（summary 列的掉落物圖示帶掛在名稱後面）
     * - 名稱往上兩層內第一個裝著圖示的祖先裡只有一件物品，而且這段是裡面第一個名稱
     * 任何一條不成立就維持站方原文。漏翻只是不好看，翻錯是假資訊。
     * @param {Element} textElement
     * @param {HTMLAnchorElement} iconLink
     * @returns {boolean}
     */
    isSingleItemRow(textElement, iconLink) {
      // 合成圖示（從 img src 猜出來的假連結）不在 DOM 裡，無法驗證列的形狀。
      if (!iconLink.isConnected) return false;
      if (!/\/item(?:=|\/)/.test(iconLink.getAttribute('href') || '')) return false;
      if (!(iconLink.compareDocumentPosition(textElement) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;

      // 只往上找兩層。真正的裝備列是「圖示盒 + 名稱盒」並排，圖示就在第 2 層。
      // 再往上就會抓到整列，而 Droptimizer 總覽列右邊掛著 Gamble／Buy 這種站台
      // 字典沒收到的欄位標籤 —— 那一列只掉一件裝備時，標籤就會被改成它的名字。
      let scope = textElement.parentElement;
      for (let depth = 0; depth < 2 && scope instanceof Element; depth += 1) {
        if (scope.contains(iconLink)) {
          const links = [];
          for (const link of scope.querySelectorAll(WOWHEAD_ITEM_OR_SPELL_LINK)) {
            if (link.contains(textElement) || textElement.contains(link)) continue;
            links.push(link);
          }
          if (this.countDistinctLinkTargets(links) !== 1) return false;
          return this.isFirstNameTextIn(scope, textElement);
        }
        scope = scope.parentElement;
      }
      return false;
    }

    /**
     * 這段文字是容器裡第一個名稱嗎？
     *
     * 一個圖示只配一段名稱。raidbots 的裝備列在品名後面還會掛沒有自己圖示的
     * 附加文字（Venomcursed Mastery 這類鑲飾效果），那些文字抓到的是同一個
     * 裝備圖示，結果整列看起來像兩件裝備。排在後面的一律放過不翻。
     * @param {Element} container
     * @param {Element} textElement
     * @returns {boolean}
     */
    isFirstNameTextIn(container, textElement) {
      for (const leaf of container.querySelectorAll('p,span,div,a')) {
        if (leaf.childElementCount !== 0) continue;
        if (leaf === textElement) return true;
        if (leaf.contains(textElement) || textElement.contains(leaf)) continue;
        if (this.isNameTextLeaf(leaf)) return false;
      }
      return true;
    }

    /**
     * Catalyst／轉化列會同時有原始掉落物與轉化後的主物品連結。
     * `original-item=` 是掛在主物品 URL 上的來源指標，不是要選取的 ID；
     * 優先選它，不能只依賴 DOM 目前的排列順序。
     * @param {HTMLAnchorElement[]} links
     * @returns {HTMLAnchorElement|null}
     */
    pickTransformedLink(links) {
      const transformed = links.filter((link) => {
        const href = link.getAttribute('href') || '';
        const dataWowhead = link.getAttribute('data-wowhead') || '';
        return /(?:[?&])original-item=\d+/i.test(href) || /(?:^|&)original-item=\d+/i.test(dataWowhead);
      });
      return transformed.length === 1 ? transformed[0] : null;
    }

    /**
     * 這組連結指向幾件不同的物品／法術／通貨
     * @param {HTMLAnchorElement[]} links
     * @returns {number}
     */
    countDistinctLinkTargets(links) {
      const targets = new Set();
      for (const link of links) {
        const match = (link.getAttribute('href') || '').match(/\/(item|spell|currency)(?:=|\/)(\d+)/i);
        if (match) targets.add(`${match[1].toLowerCase()}=${match[2]}`);
      }
      return targets.size;
    }

    /**
     * 尋找文字節點周圍唯一的 Wowhead 圖示連結
     * @param {Element} textElement
     * @returns {HTMLAnchorElement|null}
     */
    findNearestWowheadIconLink(textElement) {
      // 0. 記住明確的物品卡片／報告列。Raidbots 催化列會同時放主物品圖示
      // 與原始掉落物的小圖示，稍後會讓卡片內的第一個有效連結優先。
      const itemCard =
        typeof textElement.closest === 'function'
          ? textElement.closest(
              ITEM_CARD_SELECTOR
            )
          : null;

      // 名稱自己那一塊：裡面的圖示是掛在這件裝備上的寶石／附魔，只有第 1 步
      // （圖示排在名稱前面的小單元）可以用，其他路徑一律跳過。
      const nameBlock = textElement.parentElement instanceof Element ? textElement.parentElement : null;

      const findCardLink = (card) => {
        const links = this.collectIconLinks(card, textElement, { excludeWithin: nameBlock });

        // 一件裝備最多兩個連結：主物品與催化前的原始掉落物。超過就代表這張
        // 「卡片」裝的是一整套裝備 —— Top Gear 的比較列每一列都是 13 件裝備的
        // 圖示，卻和 Droptimizer 的單件列共用 data-test="actor-compare-row"。
        // 那種列裡沒有任何辦法知道文字屬於哪一件，一律不配對。
        if (this.countDistinctLinkTargets(links) > 2) return null;

        const transformedLink = this.pickTransformedLink(links);
        if (transformedLink) return transformedLink;

        // 沒有轉化來源標記時，維持站方物品卡片的既有順序：第一個有效
        // Wowhead 連結是裝備本體，後續才是鑲嵌的插槽寶石。
        if (links.length) return links[0];

        // 支援 Top Gear 等使用 noLink: true 的裝備卡片（從 img.src 提取 itemId/currencyId）
        const img = card.querySelector('img[src*="/id/item/"], img[src*="/id/spell/"], img[src*="/id/currency/"]');
        if (img) {
          const m = (img.getAttribute('src') || '').match(/\/id\/(item|spell|currency)\/(\d+)\.png/);
          if (m) {
            const fakeLink = document.createElement('a');
            fakeLink.setAttribute('href', `//tw.wowhead.com/${m[1]}=${m[2]}`);
            return fakeLink;
          }
        }
        return null;
      };

      // 報告列會同時有主物品與原始掉落物圖示；先取卡片內的主物品連結。
      if (itemCard && itemCard.matches('[data-test="actor-compare-row"]')) {
        const cardLink = findCardLink(itemCard);
        if (cardLink) return cardLink;
      }

      // 1. 檢查文字節點直接同層或直接父容器內緊鄰的專屬圖示（例如附魔卷軸、
      // 特定法術/通貨圖示）；非 Raidbots 報告列維持既有的近鄰優先行為。
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
        // 只收「沒有被別的名稱認領」的圖示：附魔／寶石小單元自己的圖示不算，
        // 否則裝備名會被換成那條附魔的名字。
        const directLinks = this.collectIconLinks(immediateParent, textElement, { requirePrecedes: true });
        if (directLinks.length && this.isFirstNameTextIn(immediateParent, textElement)) {
          if (directLinks.length === 1) return directLinks[0];
          const transformedLink = this.pickTransformedLink(directLinks);
          if (transformedLink && this.countDistinctLinkTargets(directLinks) <= 2) return transformedLink;
        }
      }

      // 2. 其他明確物品卡片（支援帶插槽寶石與 noLink: true 的裝備）
      if (itemCard) {
        const cardLink = findCardLink(itemCard);
        if (cardLink) return cardLink;
      }

      // 3. 常規向上回溯祖先（用於無特定 class 的自訂表格/圖表視圖）
      let ancestor = textElement;
      for (let depth = 0; depth < 5 && ancestor; depth += 1) {
        ancestor = ancestor.parentElement;
        if (!(ancestor instanceof Element)) continue;

        const mainLinks = this.collectIconLinks(ancestor, textElement, { excludeWithin: nameBlock });

        // 如果這個祖先節點內還沒有包含圖示，繼續往上層祖先搜尋
        if (mainLinks.length === 0) continue;

        // 這個圖示已經有自己的名稱排在前面了，這一段是附加文字，不要配對
        if (!this.isFirstNameTextIn(ancestor, textElement)) return null;

        // 多於 1 個圖示時只有一種情況可以救：那是同一件裝備的圖示堆疊
        // （主物品 + 催化前的原始掉落物）。其餘（好運符／地城總覽列）該列文字
        // 是地城/首領名稱，絕對不可關聯，直接返回 null。
        if (mainLinks.length > 1) {
          const transformedLink = this.pickTransformedLink(mainLinks);
          if (transformedLink && this.countDistinctLinkTargets(mainLinks) <= 2) return transformedLink;
          return null;
        }

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
      if (!this.options.enableSafeLinkify || this.options.enableTextOnlyRename) return false;

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
        if (candidate.closest(LINKIFY_SKIP_SELECTOR)) continue;
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

        if (this.options.enableTextOnlyRename) {
          // 先翻譯站方自己的徽章／標籤，再尋找仍是英文的純文字物品名；
          // 否則像 UPG、Upgrade cost 等同卡片文字可能搶先被當成物品名稱。
          if (typeof this.options.onScan === 'function') {
            this.options.onScan(root);
          }
          this.renameTextOnlyNamesByProbe(root);
        } else {
          if (this.linkifyNearbyItemNames(root)) {
            linkifyTouched = true;
          }
          if (typeof this.options.onScan === 'function') {
            this.options.onScan(root);
          }
        }

        this.patchWowheadLinks(root);
        this.renameIconLinksByProbe(root);
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
          // 站方在 hover 之類的重繪會把整條麵包屑換回英文，我們再翻一次；隔著
          // 160ms 的 debounce，使用者會看到一次明顯的閃爍。小批變動改成同步處理
          // —— MutationObserver 的 callback 在瀏覽器繪製前就跑完，英文那一幀根本
          // 不會被畫出來。
          //
          // 門檻看的是「這批帶進來多少 DOM」，不是變動的型別。archon 的 hover 重繪
          // 是 childList 而不是改文字（實測 10 個文字節點），所以用型別分辨會完全
          // 失效；路由切換帶進來的是整個頁面，用重量才分得開。
          let addedWeight = 0;

          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              for (const added of mutation.addedNodes) {
                if (added.nodeType === Node.ELEMENT_NODE) {
                  addedWeight += 1 + (added.getElementsByTagName
                    ? added.getElementsByTagName('*').length : 0);
                  this.queueRoot(added);
                } else if (added.nodeType === Node.TEXT_NODE) {
                  addedWeight += 1;
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

          if (this.options.syncSmallMutations && addedWeight <= this.syncFlushMaxNodes && this.pendingRoots.size) {
            if (this.flushTimer !== null) {
              window.clearTimeout(this.flushTimer);
              this.flushTimer = null;
            }
            this.flushPendingRoots();
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
      const pageWindow = getPageWindow();
      const rawPushState = pageWindow.history.pushState.bind(pageWindow.history);
      const self = this;
      pageWindow.history.pushState = function (...args) {
        const result = rawPushState(...args);
        self.onUrlChange();
        return result;
      };

      const rawReplaceState = pageWindow.history.replaceState.bind(pageWindow.history);
      pageWindow.history.replaceState = function (...args) {
        const result = rawReplaceState(...args);
        self.onUrlChange();
        return result;
      };

      pageWindow.addEventListener('popstate', () => this.onUrlChange());
      pageWindow.addEventListener('hashchange', () => this.onUrlChange());
    }
  }

  /**
   * 覆寫 window.Locale / window.whTooltips 為 zh-TW。
   * 建立實例時（autoInit 預設 true）會自動呼叫，一般不需手動使用。
   */
  WowheadTwHelper.setupGlobalLocale = setupGlobalLocale;

  return WowheadTwHelper;
});
