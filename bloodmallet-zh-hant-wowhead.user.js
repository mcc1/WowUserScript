// ==UserScript==
// @name         Bloodmallet Traditional Chinese Wowhead
// @namespace    https://bloodmallet.com/
// @version      0.7.1
// @description  Add zh-hant mode, switch item links/names to the zh-hant Wowhead locale, and translate class/spec labels.
// @author       mcc
// @match        https://bloodmallet.com/*
// @match        http://bloodmallet.com/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.6.1
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=1
// @updateURL    https://raw.githubusercontent.com/mcc1/WowUserScript/master/bloodmallet-zh-hant-wowhead.user.js
// @downloadURL  https://raw.githubusercontent.com/mcc1/WowUserScript/master/bloodmallet-zh-hant-wowhead.user.js
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const TW_MODE_STORAGE_KEY = 'bm-language-override';
  const TW_MODE_VALUE = 'zh-hant';
  const ZH_HANS_VALUE = 'zh-hans';
  const ZH_HANT_VALUE = 'zh-hant';
  const KEY_PREFIX = 'navbar_';
  const KEY_SUFFIX = '_selector';

  // 職業／專精／種族的譯名不手寫，一律取自 libs/game-names-tw.js
  // （暴雪 client DB2 的官方 zhTW）。該檔尚未產生時安全降級為查不到。
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

  /** bloodmallet 以 snake_case 的職業代號當 CSS class，需要官方英文名清單來比對 */
  function wowClassSlugs() {
    const table = gameNames();
    const list = table && table.UNIT_LISTS ? table.UNIT_LISTS.classes : null;
    if (!Array.isArray(list)) return [];
    return list.map(function (name) {
      return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    });
  }

  // 戰鬥風格是模擬器概念，不是遊戲實體。Patchwerk 雖然源自 Naxxramas 的首領
  // 「縫補者」，但在模擬器語境下指的是站樁不動的木樁戰，與 raidbots 用語一致。
  const FIGHT_STYLE_TW_MAP = Object.freeze({
    patchwerk: '木樁戰',
    castingpatchwerk: '施法木樁戰',
    castingpatchwerk5: '施法木樁戰 (5目標)',
    castingpatchwerk3: '施法木樁戰 (3目標)',
    hecticaddcleave: '混亂順劈',
    dungeon: '地城',
    dungeonslice: '地城切片',
  });

  const SLOT_LABELS_TW = Object.freeze({
    'Head': '頭部',
    'Hands': '手部',
    'Neck': '頸部',
    'Waist': '腰部',
    'Shoulders': '肩部',
    'Legs': '腿部',
    'Back': '背部',
    'Feet': '腳部',
    'Chest': '胸部',
    'Finger': '手指',
    'Finger 1': '手指 1',
    'Finger 2': '手指 2',
    'Trinket': '飾品',
    'Trinket 1': '飾品 1',
    'Trinket 2': '飾品 2',
    'Wrists': '手腕',
    'Main Hand': '主手',
    'Off Hand': '副手',
    'Spec &': '專精 &',
    'Class': '職業',
    'Spec': '專精',
    'Race': '種族',
    'Talents': '天賦',
    'Tier': '套裝',
    'Fight Style': '戰鬥風格',
    'Target Error': '目標誤差',
    'Iterations': '迭代次數',
    'SimC Hash': 'SimC 版本雜湊',
  });

  const CHARACTER_PROFILE_SLOT_IDS = [
    'c_head', 'c_hands', 'c_neck', 'c_waist', 'c_shoulders', 'c_legs',
    'c_back', 'c_feet', 'c_chest', 'c_finger1', 'c_finger2',
    'c_trinket1', 'c_trinket2', 'c_wrists', 'c_main_hand', 'c_off_hand',
  ];

  const isSettingsPage = location.pathname === '/settings/general';
  const isChartPage = location.pathname.startsWith('/chart/');
  const isIndexPage = /^\/(?:index\/?)?$/.test(location.pathname);

  function normalizeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s-]+/g, '_');
  }

  function translateClassOrSpec(value) {
    return lookupGameUnit(value);
  }

  function getPathClassAndSpec() {
    const parts = location.pathname.split('/').filter(Boolean);
    return {
      wowClass: parts[1] || '',
      wowSpec: parts[2] || '',
    };
  }

  function setElementTextById(id, text) {
    const element = document.getElementById(id);
    if (element && text && element.textContent !== text) {
      element.textContent = text;
    }
  }

  function translateClassAndSpecLabels() {
    const { wowClass, wowSpec } = getPathClassAndSpec();
    const classTw = lookupGameUnit(wowClass);
    const specTw = lookupGameUnit(wowSpec);

    if (classTw) {
      setElementTextById('navbar_wow_class_selection', classTw);
      setElementTextById('c_class', classTw);
    }
    if (specTw) {
      setElementTextById('navbar_wow_spec_selection', specTw);
      setElementTextById('c_spec', specTw);
    }

    const selectorLinks = document.querySelectorAll('a[id^="navbar_"][id$="_selector"]');
    for (const link of selectorLinks) {
      const id = link.id || '';
      const key = id.slice(KEY_PREFIX.length, id.length - KEY_SUFFIX.length);
      const translated = translateClassOrSpec(key);
      if (translated && link.textContent !== translated) {
        link.textContent = translated;
      }
    }
  }

  function translateCharacterProfile() {
    // 1. 翻譯所有欄位值（Class, Spec, Race, Fight Style 等）
    const raceEl = document.getElementById('c_race');
    if (raceEl) {
      const twRace = lookupGameUnit(raceEl.textContent);
      if (twRace) raceEl.textContent = twRace;
    }

    const fightStyleEl = document.getElementById('c_fight_style');
    if (fightStyleEl) {
      const key = normalizeKey(fightStyleEl.textContent);
      const twStyle = FIGHT_STYLE_TW_MAP[key];
      if (twStyle) fightStyleEl.textContent = twStyle;
    }

    const classEl = document.getElementById('c_class');
    if (classEl) {
      const twClass = lookupGameUnit(classEl.textContent);
      if (twClass) classEl.textContent = twClass;
    }

    const specEl = document.getElementById('c_spec');
    if (specEl) {
      const twSpec = lookupGameUnit(specEl.textContent);
      if (twSpec) specEl.textContent = twSpec;
    }

    // 2. 翻譯未填充物品時的部位佔位文字與已有裝備圖示
    for (const id of CHARACTER_PROFILE_SLOT_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.children.length === 0) {
        const text = el.textContent.trim();
        const translated = SLOT_LABELS_TW[text];
        if (translated && el.textContent !== translated) {
          el.textContent = translated;
        }
      } else {
        const link = el.querySelector('a[href*="wowhead.com"]');
        if (link && helper) {
          const href = link.getAttribute('href') || '';
          const twHref = helper.toTwWowheadUrl(href);
          if (twHref && href !== twHref) {
            link.setAttribute('href', twHref);
          }
          helper.applyTwDomainToDataWowhead(link);
          if (link.dataset.whRenameLink !== 'true') {
            link.dataset.whRenameLink = 'true';
            link.setAttribute('data-wh-rename-link', 'true');
          }
        }
      }
    }

    // 3. 翻譯 Table 標題列
    const profileLabels = document.querySelectorAll('#meta-info th, #meta-info td, #character-profile-label button');
    for (const el of profileLabels) {
      const text = (el.textContent || '').trim();
      if (SLOT_LABELS_TW[text]) {
        el.textContent = SLOT_LABELS_TW[text];
      }
      if (text.includes('Character profile')) {
        el.textContent = text.replace('Character profile', '角色配置');
      }
      if (text.includes('SimulationCraft settings')) {
        el.textContent = text.replace('SimulationCraft settings', 'SimulationCraft 設定');
      }
    }

    if (helper) {
      helper.queueWowheadRefresh();
    }
  }

  function isTwModeEnabled() {
    try {
      const val = window.localStorage.getItem(TW_MODE_STORAGE_KEY);
      return val === null || val === TW_MODE_VALUE || val === 'true';
    } catch (_) {
      // 瀏覽器封鎖 storage 時視為預設啟用，不讓整支腳本中止
      return true;
    }
  }

  function setTwModeEnabled(enabled) {
    try {
      window.localStorage.setItem(TW_MODE_STORAGE_KEY, enabled ? TW_MODE_VALUE : 'false');
    } catch (_) {}
  }

  function injectZhHantOption() {
    const select = document.querySelector('select#language_selection[name="language"]');
    const form = select ? select.closest('form[action="/i18n/setlang/"]') : null;
    if (!select || !form) {
      return;
    }

    let zhHantOption = select.querySelector('option[value="zh-hant"]');
    if (!zhHantOption) {
      zhHantOption = document.createElement('option');
      zhHantOption.value = ZH_HANT_VALUE;
      zhHantOption.textContent = '正體中文 (zh-hant)';
      select.appendChild(zhHantOption);
    }

    if (isTwModeEnabled() && select.value === ZH_HANS_VALUE) {
      select.value = ZH_HANT_VALUE;
    }

    form.addEventListener(
      'submit',
      () => {
        const useTraditional = select.value === ZH_HANT_VALUE;
        setTwModeEnabled(useTraditional);

        if (useTraditional) {
          select.value = ZH_HANS_VALUE;
        }
      },
      true
    );
  }

  function getTranslateKeyFromElementClass(element) {
    for (const className of element.classList) {
      if (className.startsWith('translate_')) {
        return className.slice('translate_'.length);
      }
    }
    return '';
  }

  function detectWowClassFromElement(element) {
    const className = element.className || '';
    for (const wowClass of wowClassSlugs()) {
      if (className.includes(`translate_${wowClass}`) || className.includes(`${wowClass}-`)) {
        return wowClass;
      }
    }
    return '';
  }

  function parseChartPathFromHref(href) {
    try {
      const url = new URL(href, window.location.href);
      const match = url.pathname.match(/^\/chart\/([^/]+)\/([^/]+)\//);
      if (!match) {
        return { wowClass: '', wowSpec: '' };
      }
      return { wowClass: normalizeKey(match[1]), wowSpec: normalizeKey(match[2]) };
    } catch (_) {
      return { wowClass: '', wowSpec: '' };
    }
  }

  function translateIndexClassSpecLinks(root = document) {
    const table = root.querySelector('#spec_table');
    if (!table) {
      return;
    }

    const specButtons = table.querySelectorAll('a.spec-btn');
    for (const btn of specButtons) {
      const { wowSpec } = parseChartPathFromHref(btn.getAttribute('href') || '');
      const translated = lookupGameUnit(wowSpec);
      if (translated && btn.textContent !== translated) {
        btn.textContent = translated;
      }
    }

    const classHeaders = table.querySelectorAll('.wow-class-header-content');
    for (const header of classHeaders) {
      const wowClass = detectWowClassFromElement(header);
      const translated = lookupGameUnit(wowClass);
      if (translated && header.textContent !== translated) {
        header.textContent = translated;
      }
    }

    const translatableElements = table.querySelectorAll('[class*="translate_"]');
    for (const element of translatableElements) {
      const translateKey = getTranslateKeyFromElementClass(element);
      if (!translateKey) continue;

      const translated = translateClassOrSpec(translateKey);
      if (!translated) continue;

      if (element.textContent !== translated) {
        element.textContent = translated;
      }
    }
  }

  // ── Wowhead 全域強制設定 ─────────────────────────────────────────────────
  function forceTwWowheadEnvironment() {
    window.Locale = {
      getId: function () { return 10; },
      getName: function () { return 'zhtw'; },
    };

    if (typeof window.whTooltips === 'undefined') {
      window.whTooltips = {};
    }
    window.whTooltips.colorLinks = true;
    window.whTooltips.iconizeLinks = true;
    window.whTooltips.domain = 'tw';
    window.whTooltips.locale = 'zhtw';
    window.whTooltips.renameLinks = true;
  }

  // ── WowheadTwHelper 實例 ──────────────────────────────────────────────────
  let helper = null;
  if (isTwModeEnabled()) {
    forceTwWowheadEnvironment();
    helper = new window.WowheadTwHelper({
      enableRenameLinks: true,
      enableSafeLinkify: false,
      onScan: (root) => {
        translateClassAndSpecLabels();
        translateCharacterProfile();
        if (isIndexPage) {
          translateIndexClassSpecLinks(root);
        }
      },
      onUrlChange: () => {
        if (helper) helper.runFullPass();
      }
    });
  }

  function patchChartPrototypeWhenReady() {
    let retries = 0;
    const maxRetries = 120;

    const intervalId = window.setInterval(() => {
      retries += 1;
      const Ctor = window.BmChartData;

      if (!Ctor || !Ctor.prototype) {
        if (retries >= maxRetries) {
          window.clearInterval(intervalId);
        }
        return;
      }

      if (Ctor.prototype.__twWowheadPatched) {
        window.clearInterval(intervalId);
        return;
      }

      const originalGetUrl = Ctor.prototype._get_wowhead_url;
      if (typeof originalGetUrl === 'function' && helper) {
        Ctor.prototype._get_wowhead_url = function (key) {
          let originalUrl = originalGetUrl.call(this, key);
          if (typeof originalUrl !== 'string') {
            return originalUrl;
          }
          return helper.toTwWowheadUrl(originalUrl) || originalUrl;
        };
      }

      const originalGetLink = Ctor.prototype.get_wowhead_link;
      if (typeof originalGetLink === 'function') {
        Ctor.prototype.get_wowhead_link = function (key) {
          const linkNode = originalGetLink.call(this, key);
          if (linkNode && linkNode.nodeType === Node.ELEMENT_NODE && linkNode.tagName === 'A') {
            linkNode.dataset.whRenameLink = 'true';
            linkNode.setAttribute('data-wh-rename-link', 'true');
            if (helper) {
              const href = linkNode.getAttribute('href');
              if (href) {
                const twHref = helper.toTwWowheadUrl(href);
                if (twHref) linkNode.setAttribute('href', twHref);
              }
              helper.applyTwDomainToDataWowhead(linkNode);
              helper.queueWowheadRefresh();
            }
          }
          return linkNode;
        };
      }

      Ctor.prototype.__twWowheadPatched = true;
      window.clearInterval(intervalId);

      if (helper) {
        helper.runFullPass();
      }
    }, 100);
  }

  function enableTwModeOnChartPages() {
    patchChartPrototypeWhenReady();

    if (helper) {
      helper.start();
    }

    // 監聽並自動翻譯 Character profile
    const metaObserver = new MutationObserver(() => {
      translateCharacterProfile();
    });

    const metaTarget = document.getElementById('meta-info') || document.body;
    metaObserver.observe(metaTarget, {
      childList: true,
      subtree: true,
    });

    translateCharacterProfile();
    setTimeout(translateCharacterProfile, 500);
    setTimeout(translateCharacterProfile, 1500);
    setTimeout(translateCharacterProfile, 3000);
  }

  function enableTwModeOnIndexPage() {
    let retries = 0;
    const maxRetries = 80;

    const intervalId = window.setInterval(() => {
      retries += 1;
      translateIndexClassSpecLinks(document);

      const table = document.querySelector('#spec_table');
      if (table && table.querySelector('.spec-btn')) {
        window.clearInterval(intervalId);
      } else if (retries >= maxRetries) {
        window.clearInterval(intervalId);
      }
    }, 100);

    if (helper) {
      helper.start();
    }
  }

  function start() {
    // 只有在 zh-hant 模式開啟時才覆寫 Wowhead 全域語系，
    // 否則使用者從設定頁切回其他語言仍會被強制看到繁中 tooltip。
    if (isTwModeEnabled()) {
      forceTwWowheadEnvironment();
    }

    if (isSettingsPage) {
      injectZhHantOption();
    }

    if (isChartPage && isTwModeEnabled()) {
      enableTwModeOnChartPages();
    }

    if (isIndexPage && isTwModeEnabled()) {
      enableTwModeOnIndexPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
