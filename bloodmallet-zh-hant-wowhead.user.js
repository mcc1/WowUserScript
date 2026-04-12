// ==UserScript==
// @name         Bloodmallet Traditional Chinese Wowhead
// @namespace    https://bloodmallet.com/
// @version      0.3.4
// @description  Add zh-hant mode, switch item links/names to tw.wowhead.com, and translate class/spec labels.
// @author       mcc
// @match        https://bloodmallet.com/*
// @match        http://bloodmallet.com/*
// @run-at       document-idle
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

  const CLASS_TW_MAP = Object.freeze({
    death_knight: '死亡騎士',
    demon_hunter: '惡魔獵人',
    druid: '德魯伊',
    evoker: '喚能師',
    hunter: '獵人',
    mage: '法師',
    monk: '武僧',
    paladin: '聖騎士',
    priest: '牧師',
    rogue: '盜賊',
    shaman: '薩滿',
    warlock: '術士',
    warrior: '戰士',
  });

  const SPEC_TW_MAP = Object.freeze({
    affliction: '痛苦',
    arcane: '秘法',
    arms: '武器',
    assassination: '刺殺',
    augmentation: '強化',
    balance: '平衡',
    beast_mastery: '野獸控制',
    blood: '血魄',
    brewmaster: '釀酒',
    demonology: '惡魔學識',
    destruction: '毀滅',
    devastation: '破滅',
    devourer: '噬滅',
    discipline: '戒律',
    elemental: '元素',
    enhancement: '增強',
    feral: '野性戰鬥',
    fire: '火焰',
    frost: '冰霜',
    fury: '狂怒',
    guardian: '守護者',
    havoc: '災虐',
    holy: '神聖',
    marksmanship: '射擊',
    mistweaver: '禦霧',
    outlaw: '暴徒',
    preservation: '護存',
    protection: '防護',
    restoration: '恢復',
    retribution: '懲戒',
    shadow: '暗影',
    subtlety: '敏銳',
    survival: '生存',
    unholy: '穢邪',
    vengeance: '復仇',
    windwalker: '御風',
  });

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
    const key = normalizeKey(value);
    return CLASS_TW_MAP[key] || SPEC_TW_MAP[key] || null;
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
    const classTw = CLASS_TW_MAP[normalizeKey(wowClass)] || null;
    const specTw = SPEC_TW_MAP[normalizeKey(wowSpec)] || null;

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
    for (const wowClass of Object.keys(CLASS_TW_MAP)) {
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

    // fallback path: spec button text from href /chart/{class}/{spec}/...
    const specButtons = table.querySelectorAll('a.spec-btn');
    for (const btn of specButtons) {
      const { wowSpec } = parseChartPathFromHref(btn.getAttribute('href') || '');
      const translated = SPEC_TW_MAP[wowSpec] || null;
      if (translated && btn.textContent !== translated) {
        btn.textContent = translated;
      }
    }

    // fallback path: class headers
    const classHeaders = table.querySelectorAll('.wow-class-header-content');
    for (const header of classHeaders) {
      const wowClass = detectWowClassFromElement(header);
      const translated = CLASS_TW_MAP[wowClass] || null;
      if (translated && header.textContent !== translated) {
        header.textContent = translated;
      }
    }

    const translatableElements = table.querySelectorAll('[class*="translate_"]');
    for (const element of translatableElements) {
      const translateKey = getTranslateKeyFromElementClass(element);
      if (!translateKey) {
        continue;
      }

      const translated = translateClassOrSpec(translateKey);
      if (!translated) {
        continue;
      }

      if (element.textContent !== translated) {
        element.textContent = translated;
      }
    }
  }

  function isTwModeEnabled() {
    return window.localStorage.getItem(TW_MODE_STORAGE_KEY) === TW_MODE_VALUE;
  }

  function setTwModeEnabled(enabled) {
    if (enabled) {
      window.localStorage.setItem(TW_MODE_STORAGE_KEY, TW_MODE_VALUE);
      return;
    }
    window.localStorage.removeItem(TW_MODE_STORAGE_KEY);
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
          // bloodmallet only supports zh-hans, so submit zh-hans and keep zh-hant in localStorage.
          select.value = ZH_HANS_VALUE;
        }
      },
      true
    );
  }

  function makeTwWowheadUrl(urlLike) {
    try {
      const url = new URL(urlLike, window.location.href);
      if (!url.hostname.endsWith('.wowhead.com')) {
        return null;
      }
      if (url.hostname === 'tw.wowhead.com') {
        return null;
      }
      if (!url.pathname.includes('item=')) {
        return null;
      }
      url.hostname = 'tw.wowhead.com';
      return url.toString();
    } catch (_) {
      return null;
    }
  }

  const SLOT_LABELS_TW = Object.freeze({
    'Head': '頭',
    'Hands': '手',
    'Neck': '頸',
    'Waist': '腰',
    'Shoulders': '肩',
    'Legs': '腿',
    'Back': '背',
    'Feet': '腳',
    'Chest': '胸',
    'Ring': '指環',
    'Trinket': '飾品',
    'Wrists': '腕',
    'Weapon': '武器',
    'Off-Hand': '副手',
    'Spec &': '專精 &',
  });

  const CHARACTER_PROFILE_SLOT_IDS = [
    'c_head', 'c_hands', 'c_neck', 'c_waist', 'c_shoulders', 'c_legs',
    'c_back', 'c_feet', 'c_chest', 'c_finger1', 'c_finger2',
    'c_trinket1', 'c_trinket2', 'c_wrists', 'c_main_hand', 'c_off_hand',
    'c_spec',
  ];

  function translateCharacterProfile() {
    // Translate slot placeholder texts (only if no child elements = no item link yet)
    for (const id of CHARACTER_PROFILE_SLOT_IDS) {
      const el = document.getElementById(id);
      if (!el || el.children.length > 0) continue;
      const text = el.textContent.trim();
      const translated = SLOT_LABELS_TW[text];
      if (translated && el.textContent !== translated) {
        el.textContent = translated;
      }
    }

    // Translate "Character profile" button text node
    const profileBtn = document.querySelector('#character-profile-label button');
    if (profileBtn) {
      for (const node of profileBtn.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Character profile')) {
          node.textContent = node.textContent.replace('Character profile', '角色配置');
          break;
        }
      }
    }
  }

  let refreshTimer = null;
  let refreshRetryCount = 0;
  const MAX_REFRESH_RETRIES = 30;

  function queueWowheadRefresh() {
    if (refreshTimer !== null) {
      return;
    }

    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      const wowheadPower = window.$WowheadPower;
      if (wowheadPower && typeof wowheadPower.refreshLinks === 'function') {
        refreshRetryCount = 0;
        wowheadPower.refreshLinks();
      } else if (refreshRetryCount < MAX_REFRESH_RETRIES) {
        refreshRetryCount += 1;
        queueWowheadRefresh();
      }
    }, 80);
  }

  function patchExistingLinks(root = document) {
    const links = root.querySelectorAll('a[href*="wowhead.com/item="]');
    let touched = false;

    for (const link of links) {
      const twUrl = makeTwWowheadUrl(link.href);
      if (twUrl && link.href !== twUrl) {
        link.href = twUrl;
        touched = true;
      }

      // 只對純文字連結（不含 img）加 rename，避免破壞 character profile 圖示排版
      const hasText = link.textContent.trim().length > 0;
      const hasImage = link.querySelector('img') !== null;
      if (hasText && !hasImage && link.dataset.whRenameLink !== 'true') {
        link.dataset.whRenameLink = 'true';
        touched = true;
      }
    }

    if (touched) {
      queueWowheadRefresh();
    }
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
      if (typeof originalGetUrl === 'function') {
        Ctor.prototype._get_wowhead_url = function (key) {
          const originalUrl = originalGetUrl.call(this, key);
          if (typeof originalUrl !== 'string') {
            return originalUrl;
          }
          return originalUrl.replace('https://cn.wowhead.com/', 'https://tw.wowhead.com/');
        };
      }

      const originalGetLink = Ctor.prototype.get_wowhead_link;
      if (typeof originalGetLink === 'function') {
        Ctor.prototype.get_wowhead_link = function (key) {
          const linkNode = originalGetLink.call(this, key);
          if (linkNode && linkNode.nodeType === Node.ELEMENT_NODE && linkNode.tagName === 'A') {
            linkNode.dataset.whRenameLink = 'true';
          }
          return linkNode;
        };
      }

      Ctor.prototype.__twWowheadPatched = true;
      window.clearInterval(intervalId);

      patchExistingLinks(document);
      translateClassAndSpecLabels();
      translateCharacterProfile();
    }, 100);
  }

  function observeChartUpdates() {
    const observer = new MutationObserver((mutations) => {
      let shouldPatch = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof Element)) {
              continue;
            }
            if (
              node.matches('a[href*="wowhead.com/item="], .bloodmallet_chart, a[id^="navbar_"][id$="_selector"]') ||
              node.querySelector('a[href*="wowhead.com/item="], .bloodmallet_chart, a[id^="navbar_"][id$="_selector"]')
            ) {
              shouldPatch = true;
              break;
            }
          }
          if (shouldPatch) {
            break;
          }
        }

        if (
          mutation.type === 'attributes' &&
          mutation.target instanceof HTMLAnchorElement &&
          mutation.attributeName === 'href'
        ) {
          shouldPatch = true;
          break;
        }
      }

      if (shouldPatch) {
        patchExistingLinks(document);
        translateClassAndSpecLabels();
        translateCharacterProfile();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href'],
    });

    patchExistingLinks(document);
    translateClassAndSpecLabels();
    translateCharacterProfile();
  }

  function enableTwModeOnChartPages() {
    const charts = document.querySelectorAll('div.bloodmallet_chart');
    for (const chart of charts) {
      // Ensure bloodmallet keeps using its zh-hans translation payload.
      chart.dataset.language = ZH_HANS_VALUE;
    }

    patchChartPrototypeWhenReady();
    observeChartUpdates();
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

    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;

      for (const mutation of mutations) {
        if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) {
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          if (
            node.matches('#spec_table, .spec-cell, .spec-btn, [class*="translate_"]') ||
            node.querySelector('#spec_table, .spec-cell, .spec-btn, [class*="translate_"]')
          ) {
            shouldTranslate = true;
            break;
          }
        }

        if (shouldTranslate) {
          break;
        }
      }

      if (shouldTranslate) {
        translateIndexClassSpecLinks(document);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    translateIndexClassSpecLinks(document);
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
})();
