// ==UserScript==
// @name         Bloodmallet Traditional Chinese Wowhead
// @namespace    https://bloodmallet.com/
// @version      0.9.0
// @description  Add zh-hant mode, switch item links/names to the zh-hant Wowhead locale, and translate class/spec labels.
// @author       mcc
// @match        https://bloodmallet.com/*
// @match        http://bloodmallet.com/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.7.2
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=2
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

  // 圖表類型是站台自己的分類標籤，頁面上沒有可用的遊戲 ID，屬於 AGENTS.md 說的
  // 「只有這類才手寫」。譯名仍取暴雪官方 zh-TW，查證記錄：
  //   Phial 藥瓶（item=191359）、Potion 藥水（item=191387）、附魔（spell=7411）
  // 「副屬性分配」與「天賦目標數量縮放」暴雪沒有對應字串 —— 前者用台服社群通行
  // 的說法，後者是 bloodmallet 自創術語。
  const CHART_TYPE_TW_MAP = Object.freeze({
    trinkets: '飾品',
    phials: '藥瓶',
    potions: '藥水',
    races: '種族',
    weapon_enchantments: '武器附魔',
    secondary_distributions: '副屬性分配',
    talent_target_scaling: '天賦目標數量縮放',
  });

  // 站台 UI 控件。Dungeon / Raid 這裡指飾品「來源」，與同名的戰鬥風格語境不同，
  // 所以另開一張表而不是共用 FIGHT_STYLE_TW_MAP。
  // On Use / Passive：官方 tooltip 只寫「使用：」「裝備：」，沒有名詞化的分類詞。
  const UI_TW_MAP = Object.freeze({
    'Advanced Options': '進階選項',
    'Custom fight style': '自訂戰鬥風格',
    'Custom APL': '自訂 APL',
    'Use absolute values': '顯示絕對數值',
    'Raw chart data': '原始圖表資料',
    'Accept GA tracking': '接受 GA 追蹤',
    'Reject GA tracking': '拒絕 GA 追蹤',
    'Dungeon': '地城',
    'Raid': '團隊副本',
    'High PvP': 'PvP 高階',
    'Profession': '專業',
    'On Use': '使用類',
    'Passive': '被動類',
  });

  // 複合字串沒辦法完全比對，例如手風琴標題是「Character profile (Source:
  // simulationcraft)」。改用子字串置換，長的排前面避免被短的先吃掉。
  const UI_PARTIAL_TW = Object.freeze({
    'SimulationCraft settings': 'SimulationCraft 設定',
    '(Source: simulationcraft)': '（來源：simulationcraft）',
    'Character profile': '角色配置',
  });

  const CHART_AXIS_TW_MAP = Object.freeze({
    '% damage per second': '每秒傷害百分比',
    'damage per second': '每秒傷害',
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
  const isIndexPage = /^\/(?:index(?:\.html?)?\/?)?$/.test(location.pathname);

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

  /** /chart/<class>/<spec>/<type>/<fight style> */
  function getChartPathParts() {
    const parts = location.pathname.split('/').filter(Boolean);
    return {
      wowClass: parts[1] || '',
      wowSpec: parts[2] || '',
      chartType: parts[3] || '',
      fightStyle: parts[4] || '',
    };
  }

  function setElementTextById(id, text) {
    const element = document.getElementById(id);
    if (element && text && element.textContent !== text) {
      element.textContent = text;
    }
  }

  function translateClassAndSpecLabels() {
    const { wowClass, wowSpec, chartType, fightStyle } = getChartPathParts();
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

    // 目前選中的圖表類型與戰鬥風格改從網址推，比抓 DOM 文字穩 —— 站方改了
    // 顯示字串也不會失效，因為 URL 片段就是查詢鍵本身。
    setElementTextById('navbar_simulation_type_selection', CHART_TYPE_TW_MAP[chartType]);
    setElementTextById('navbar_fight_style_selection', FIGHT_STYLE_TW_MAP[fightStyle]);

    // 選單項目的 id 形如 navbar_<key>_selector，<key> 直接就是查詢鍵。
    // 三段 fallback：遊戲資料（職業／專精）→ 圖表類型 → 戰鬥風格。
    // 戰鬥風格的譯名早就在 FIGHT_STYLE_TW_MAP 裡，只是從來沒接到導覽列上。
    const selectorLinks = document.querySelectorAll('a[id^="navbar_"][id$="_selector"]');
    for (const link of selectorLinks) {
      const id = link.id || '';
      const key = id.slice(KEY_PREFIX.length, id.length - KEY_SUFFIX.length);
      const translated = translateClassOrSpec(key)
        || CHART_TYPE_TW_MAP[key]
        || FIGHT_STYLE_TW_MAP[key];
      if (translated && link.textContent !== translated) {
        link.textContent = translated;
      }
    }
  }

  /**
   * 站台 UI 控件的翻譯。一律走文字節點，不整個換掉 textContent —— 手風琴標題
   * 「Character profile (Source: simulationcraft)」的來源那段包在子 span 裡，
   * 換掉整顆 textContent 會把那個 span 一起吃掉。
   */
  function translateUiControls(root) {
    const scope = root && root.querySelectorAll ? root : document;

    for (const el of scope.querySelectorAll('button, label, .btn')) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;

      while ((node = walker.nextNode())) {
        const raw = node.textContent;
        const trimmed = raw.trim();
        if (!trimmed) continue;

        let next = UI_TW_MAP[trimmed];
        if (!next) {
          next = trimmed;
          for (const [en, tw] of Object.entries(UI_PARTIAL_TW)) {
            if (next.includes(en)) next = next.split(en).join(tw);
          }
        }

        // 用 raw.replace 保留原本的前後空白，維持排版
        if (next !== trimmed) node.textContent = raw.replace(trimmed, next);
      }
    }
  }

  /** 圖表座標軸標題。文字與 .bm-bar-min / .bm-bar-max 混在同一個容器，只換文字節點。 */
  function translateChartAxis(root) {
    const scope = root && root.querySelectorAll ? root : document;
    for (const title of scope.querySelectorAll('.bm-axis .bm-bar-title')) {
      for (const node of title.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        const translated = CHART_AXIS_TW_MAP[node.textContent.trim()];
        if (translated && node.textContent !== translated) {
          node.textContent = translated;
        }
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

  // ── bloodmallet 語言表註冊 ──────────────────────────────────────────────
  // 站方改版後（bm-utils.js）用 bmUtils.languageMap 把站台語言碼對應到資料語
  // 言碼，再用 bmUtils.wowheadSubdomains 決定 Wowhead 子網域。兩張表都沒有
  // zh-hant，而 detectUserLanguage() 對未登記的值是原樣穿透的：
  //     'zh-hant' → 'zh-hant' → wowheadSubdomains['zh-hant'] === undefined
  // 整條鏈於是崩回英文。這就是「zh-hant 一旦真的送到伺服器，之後每次載入都
  // 變英文」的成因 — 不是我們的覆蓋層失效，是站方的查表失敗。
  //
  // 對應到 cn_CN 而非 zh_TW 是刻意的：資料與品名仍走站方既有的 cn 管線，我們
  // 在其上用 Wowhead zhTW 重寫，現行行為完全不變；差別只在 zh-hant 漏到伺服
  // 器時不再炸成英文。若日後確認站方資料支援 zh_TW，改這個常數即可。
  const BM_LANGUAGE_FALLBACK = 'cn_CN';

  function registerZhHantLanguage(utils) {
    if (!utils || utils.__twZhHantRegistered) return false;

    const map = utils.languageMap;
    if (!map || typeof map !== 'object') return false;

    if (!map[ZH_HANT_VALUE]) {
      map[ZH_HANT_VALUE] = BM_LANGUAGE_FALLBACK;
    }

    // 讓站方自己產生的 Wowhead 連結直接指向 tw，少一輪事後重寫
    const subdomains = utils.wowheadSubdomains;
    if (subdomains && typeof subdomains === 'object' && !subdomains.zh_TW) {
      subdomains.zh_TW = 'tw';
    }

    utils.__twZhHantRegistered = true;
    return true;
  }

  /**
   * bmUtils 是 bm-utils.js 在 document-start 之後才掛上 window 的，
   * 用 setter 在賦值當下註冊以避免 race，另備輪詢作為保險。
   */
  function registerZhHantLanguageWhenReady() {
    if (registerZhHantLanguage(window.bmUtils)) return;

    let current = window.bmUtils;
    try {
      Object.defineProperty(window, 'bmUtils', {
        configurable: true,
        enumerable: true,
        get() { return current; },
        set(value) {
          current = value;
          registerZhHantLanguage(value);
        },
      });
    } catch (_) {
      // defineProperty 被擋下就純靠下面的輪詢
    }

    let retries = 0;
    const intervalId = window.setInterval(() => {
      retries += 1;
      if (registerZhHantLanguage(window.bmUtils) || retries >= 120) {
        window.clearInterval(intervalId);
      }
    }, 100);
  }

  // @run-at document-start：立刻裝上攔截，趕在 bm-utils.js 賦值之前。
  // 放進 start() 就太晚了 — DOMContentLoaded 時 bmUtils 早已掛好，setter 攔不到。
  registerZhHantLanguageWhenReady();

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
        translateUiControls(root);
        translateChartAxis(root);
        if (isIndexPage) {
          translateIndexClassSpecLinks(root);
        }
      },
      onUrlChange: () => {
        if (helper) helper.runFullPass();
      }
    });
  }

  // ── 長條圖 tooltip 品名同步 ────────────────────────────────────────────
  // .bm-key 的品名是 <a data-wh-rename-link>，Wowhead widget 會把它的文字節點
  // 換成 zhTW。但 .bm-bar 的 tooltip 是 render 當下就序列化進
  // data-bm-tooltip-text 屬性的一段 HTML 字串 — widget 改得到文字節點，改不到
  // 屬性，於是 bar 的標題永遠停在站台語言（cn_CN → 简中）。
  //
  // 這不是漏翻字典，是屬性裡的 HTML 快照沒人更新；同一列正確的品名就在旁邊，
  // 回填即可，不需要查表也不需要再打一次 Wowhead。
  const TOOLTIP_TITLE_RE = /(<div class="bm-tooltip-title">)([\s\S]*?)(<\/div>)/;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 取該列的品名文字，扣掉 Wowhead 圖示 span */
  function getRowItemName(row) {
    const link = row.querySelector('.bm-key a');
    if (!link) return '';

    let text = '';
    for (const node of link.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('iconsmall')) {
        text += node.textContent;
      }
    }
    return text.trim();
  }

  function syncBarTooltipNames(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const rows = scope.querySelectorAll('.bm-row');
    let updated = 0;

    for (const row of rows) {
      const bar = row.querySelector('.bm-bar[data-bm-tooltip-text]');
      if (!bar) continue;

      const name = getRowItemName(row);
      if (!name) continue;

      const raw = bar.getAttribute('data-bm-tooltip-text') || '';
      const match = raw.match(TOOLTIP_TITLE_RE);
      if (!match) continue;

      const escaped = escapeHtml(name);
      if (match[2] === escaped) continue;

      bar.setAttribute(
        'data-bm-tooltip-text',
        raw.replace(TOOLTIP_TITLE_RE, (whole, open_, _old, close) => open_ + escaped + close)
      );

      // bm-tooltips.js 的 create_tooltip() 是在 mouseover 當下才讀這個屬性、
      // mouseleave 就把節點丟掉，所以改屬性下次 hover 就生效。這裡只補「回填
      // 剛好發生在使用者正懸停時」那一瞬間的殘影。
      const tooltipId = bar.getAttribute('data-bm-tooltip-id');
      const live = tooltipId ? document.getElementById(tooltipId) : null;
      const liveTitle = live ? live.querySelector('.bm-tooltip-title') : null;
      if (liveTitle && liveTitle.textContent !== name) {
        liveTitle.textContent = name;
      }

      updated += 1;
    }

    return updated;
  }

  let barSyncQueued = false;

  function watchBarTooltips() {
    const chart = document.getElementById('chart') || document.body;

    // Wowhead 改名是非同步的，圖表本身切換資料時也會重繪，兩邊都要跟。
    // 回填後再次掃描會因為名稱已相同而不產生變動，所以不會無限循環。
    const observer = new MutationObserver(() => {
      if (barSyncQueued) return;
      barSyncQueued = true;
      window.requestAnimationFrame(() => {
        barSyncQueued = false;
        syncBarTooltipNames();
      });
    });

    observer.observe(chart, { childList: true, subtree: true, characterData: true });

    syncBarTooltipNames();
    setTimeout(syncBarTooltipNames, 500);
    setTimeout(syncBarTooltipNames, 1500);
    setTimeout(syncBarTooltipNames, 3000);
  }

  function enableTwModeOnChartPages() {
    watchBarTooltips();

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
