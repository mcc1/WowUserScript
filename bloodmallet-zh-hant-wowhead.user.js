// ==UserScript==
// @name         Bloodmallet Traditional Chinese Wowhead
// @namespace    https://bloodmallet.com/
// @version      0.5.2
// @description  Add zh-hant mode, switch item links/names to the zh-hant Wowhead locale, and translate class/spec labels.
// @author       mcc
// @match        https://bloodmallet.com/*
// @match        http://bloodmallet.com/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.5.4
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

  const RACE_TW_MAP = Object.freeze({
    human: '人類',
    dwarf: '矮人',
    night_elf: '夜精靈',
    gnome: '地精',
    draenei: '德萊尼',
    worgen: '狼人',
    pandaren: '熊貓人',
    dracthyr: '龍希爾',
    orc: '獸人',
    undead: '不死族',
    tauren: '牛頭人',
    troll: '食人妖',
    blood_elf: '血精靈',
    goblin: '哥布林',
    nightborne: '夜裔精靈',
    highmountain_tauren: '高嶺牛頭人',
    void_elf: '虛無精靈',
    lightforged_draenei: '光鑄德萊尼',
    zandalari_troll: '贊達拉食人妖',
    kul_tiran: '庫爾提拉斯人',
    dark_iron_dwarf: '黑鐵矮人',
    vulpera: '狐狸人',
    maghar_orc: '瑪格漢獸人',
    mechagnome: '機械地精',
    earthen: '土靈',
  });

  const FIGHT_STYLE_TW_MAP = Object.freeze({
    patchwerk: '帕奇維克',
    castingpatchwerk: '施法帕奇維克',
    castingpatchwerk5: '施法帕奇維克 (5目標)',
    castingpatchwerk3: '施法帕奇維克 (3目標)',
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

  function translateCharacterProfile() {
    // 1. 翻譯所有欄位值（Class, Spec, Race, Fight Style 等）
    const raceEl = document.getElementById('c_race');
    if (raceEl) {
      const key = normalizeKey(raceEl.textContent);
      const twRace = RACE_TW_MAP[key];
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
      const key = normalizeKey(classEl.textContent);
      const twClass = CLASS_TW_MAP[key];
      if (twClass) classEl.textContent = twClass;
    }

    const specEl = document.getElementById('c_spec');
    if (specEl) {
      const key = normalizeKey(specEl.textContent);
      const twSpec = SPEC_TW_MAP[key];
      if (twSpec) specEl.textContent = twSpec;
    }

    // 2. 翻譯未填充物品時的部位佔位文字
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
        // 如果已經有裝備圖示 <a>，確保其超連結為繁中並啟用 Rename / Tooltip
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
  }

  function isTwModeEnabled() {
    const val = window.localStorage.getItem(TW_MODE_STORAGE_KEY);
    return val === null || val === TW_MODE_VALUE || val === 'true';
  }

  function setTwModeEnabled(enabled) {
    if (enabled) {
      window.localStorage.setItem(TW_MODE_STORAGE_KEY, TW_MODE_VALUE);
      return;
    }
    window.localStorage.setItem(TW_MODE_STORAGE_KEY, 'false');
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

    const specButtons = table.querySelectorAll('a.spec-btn');
    for (const btn of specButtons) {
      const { wowSpec } = parseChartPathFromHref(btn.getAttribute('href') || '');
      const translated = SPEC_TW_MAP[wowSpec] || null;
      if (translated && btn.textContent !== translated) {
        btn.textContent = translated;
      }
    }

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
    const charts = document.querySelectorAll('div.bloodmallet_chart');
    for (const chart of charts) {
      chart.dataset.language = ZH_HANS_VALUE;
    }

    patchChartPrototypeWhenReady();

    if (helper) {
      helper.observe(document.body);
      helper.startHistoryListener();
      helper.runFullPass();
    }
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
      helper.observe(document.body);
      helper.startHistoryListener();
      helper.runFullPass();
    }
  }

  function start() {
    forceTwWowheadEnvironment();

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
