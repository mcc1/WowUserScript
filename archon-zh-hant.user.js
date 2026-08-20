// ==UserScript==
// @name         Archon.gg Traditional Chinese
// @namespace    https://www.archon.gg/
// @version      0.3.0
// @description  Translate archon.gg WoW build pages to Traditional Chinese.
// @author       mcc
// @match        https://www.archon.gg/wow/*
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // ── Wowhead widget 語言設定（document-start 時執行，在 power.js 載入前）──
  // 告訴 Wowhead widget 使用繁體中文，item/spell 名稱和 tooltip 都會是繁中
  if (typeof window.whTooltips === 'undefined') {
    window.whTooltips = {};
  }
  window.whTooltips.colorLinks = true;
  window.whTooltips.iconSize = false;   // 不讓 Wowhead 在連結旁插入額外圖示，避免跑版
  window.whTooltips.domain = 'tw';      // 改版後語系改用路徑前綴，仍用 domain 指定 widget 資料語系
  // renameLinks 不設為 true（全局會破壞天賦節點圖示）
  // 只用逐個連結的 data-wh-rename-link="true" 控制哪些連結要 rename

  // ── 翻譯表 ────────────────────────────────────────────────────────────────

  const CLASS_TW = Object.freeze({
    'Death Knight': '死亡騎士',
    'Demon Hunter': '惡魔獵人',
    'Druid': '德魯伊',
    'Evoker': '喚能師',
    'Hunter': '獵人',
    'Mage': '法師',
    'Monk': '武僧',
    'Paladin': '聖騎士',
    'Priest': '牧師',
    'Rogue': '盜賊',
    'Shaman': '薩滿',
    'Warlock': '術士',
    'Warrior': '戰士',
  });

  const SPEC_TW = Object.freeze({
    'Affliction': '痛苦',
    'Arcane': '秘法',
    'Arms': '武器',
    'Assassination': '刺殺',
    'Augmentation': '強化',
    'Balance': '平衡',
    'Beast Mastery': '野獸控制',
    'Blood': '血魄',
    'Brewmaster': '釀酒',
    'Demonology': '惡魔學識',
    'Destruction': '毀滅',
    'Devastation': '破滅',
    'Devourer': '噬滅',
    'Discipline': '戒律',
    'Elemental': '元素',
    'Enhancement': '增強',
    'Feral': '野性戰鬥',
    'Fire': '火焰',
    'Frost': '冰霜',
    'Fury': '狂怒',
    'Guardian': '守護者',
    'Havoc': '災虐',
    'Holy': '神聖',
    'Marksmanship': '射擊',
    'Mistweaver': '禦霧',
    'Outlaw': '暴徒',
    'Preservation': '護存',
    'Protection': '防護',
    'Restoration': '恢復',
    'Retribution': '懲戒',
    'Shadow': '暗影',
    'Subtlety': '敏銳',
    'Survival': '生存',
    'Unholy': '穢邪',
    'Vengeance': '復仇',
    'Windwalker': '御風',
  });

  // 完整比對的 UI 字串
  const EXACT_TW = Object.freeze({
    // 導覽麵包屑
    'Meta Builds': '主流配置',
    'Articles': '文章',
    'Tier Lists': '強度排行',

    // 頁籤
    'Overview': '總覽',
    'Talents': '天賦',
    'Rotation': '迴圈',
    'Gear & Tier Set': '裝備 & 套裝',
    'Enchants & Gems': '附魔 & 寶石',
    'Consumables': '消耗品',
    'Trinkets': '飾品',

    // 內容類型
    'Mythic+': '史詩鑰石',
    'Raid': '團隊副本',

    // 篩選標籤
    'Class': '職業',
    'Spec': '專精',
    'Content': '內容',
    'Levels': '等級',
    'Dungeon': '地城',
    'Affixes': '詞綴',
    'All Dungeons': '所有地城',
    'This Week': '本週',
    'Last Week': '上週',

    // 欄位標題
    'Item': '物品',
    'Popularity': '使用率',
    'Max Key': '最高層數',
    'DPS': 'DPS',
    'Added': '新增',
    'Removed': '移除',

    // 區塊標題（不含職業/專精名的部分）
    'Stats': '屬性',
    'Stat Priority': '屬性優先級',
    'Gear Overview': '裝備總覽',
    'View All Gear Options': '查看所有裝備選項',
    'View Alternative Builds': '查看其他配置',
    'Weapons & Trinkets': '武器 & 飾品',

    // 天賦相關
    'Talent': '天賦',
    'Class Talents': '職業天賦',
    'Hero Talents': '英雄天賦',
    'Spec Talents': '專精天賦',
    'Hero Tree': '英雄天賦',
    'Spec & Hero Popularity': '專精 & 英雄使用率',
    'Keystone Level': '鑰石等級',
    'Top Log': '頂尖記錄',
    'Open Report': '開啟報告',
    'Currently Selected': '目前選擇',
    'Recommended Class Tree': '推薦職業天賦',
    'Alternative Class Talents': '替代職業天賦',
    'Export': '匯出',
    'Edit': '編輯',
    'Copy': '複製',

    // 英雄天賦名稱
    // 死亡騎士
    'Deathbringer': '死亡使者',
    'Rider of the Apocalypse': '天啟騎士',
    "San'layn": '煞婪',
    // 惡魔獵人
    'Aldrachi Reaver': '奧達奇劫奪者',
    'Fel-Scarred': '魔痕',
    'Annihilator': '殲滅者',
    // 德魯伊
    "Elune's Chosen": '伊露恩之選',
    'Keeper of the Grove': '利爪德魯伊',
    'Druid of the Claw': '林地看守者',
    'Wildstalker': '野地潛獵者',
    // 喚能師
    'Chronowarden': '時光看守者',
    'Flameshaper': '塑火者',
    'Scalecommander': '龍隊指揮官',
    // 獵人
    'Dark Ranger': '黑暗遊俠',
    'Pack Leader': '獸群領袖',
    'Sentinel': '哨兵',
    // 法師
    'Frostfire': '霜火',
    'Spellslinger': '拋法者',
    'Sunfury': '日怒',
    // 武僧
    'Conduit of the Celestials': '天尊引導者',
    'Master of Harmony': '和諧大師',
    'Shadopan': '影潘',
    // 聖騎士
    'Herald of the Sun': '太陽先驅',
    'Lightsmith': '光鑄師',
    'Templar': '聖殿騎士',
    // 牧師
    'Archon': '御靈者',
    'Oracle': '神諭者',
    'Voidweaver': '虛織者',
    // 盜賊
    'Deathstalker': '亡靈哨兵',
    'Fatebound': '命縛者',
    'Trickster': '欺詐者',
    // 薩滿
    'Farseer': '先知',
    'Stormbringer': '風暴使者',
    'Totemic': '圖騰師',
    // 術士
    'Diabolist': '崇魔者',
    'Hellcaller': '喚魔者',
    'Soul Harvester': '靈魂收割者',
    // 戰士
    'Colossus': '巨像',
    'Mountain Thane': '山脈族長',
    'Slayer': '殺戮者',

    // 天賦 tooltip 固定欄位（天賦/物品名稱由 Wowhead widget 處理，見下方）
    'Passive': '被動',
    'Active': '主動',
    'Choice Node': '選擇節點',

    // 屬性名稱
    'Intellect': '智力',
    'Strength': '力量',
    'Agility': '敏捷',
    'Stamina': '耐力',
    'Crit': '致命',
    'Haste': '加速',
    'Mastery': '精通',
    'Versatility': '臨機',
    'Vers': '臨機',

    // 其他 UI
    'Last updated': '最後更新',
    'Total Parses': '解析總數',
    'Show More': '顯示更多',
    'Show Less': '顯示更少',
    'Jump to': '跳至',
    'Download App': '下載應用程式',
    'Sign In': '登入',
    'BiS': '最佳裝備',
    'Remove Descriptive Text': '移除說明文字',
    'Advanced Settings': '進階設定',

    // 遊戲版本選單
    'WoW - Midnight': 'WoW - 午夜',
    'WoW - MoP': 'WoW - 潘達利亞之霧',
    'WoW - SoD': 'WoW - 發現賽季',
    'WoW - Fresh': 'WoW - 全新伺服器',
  });

  // 動態標題後綴：「{Spec} {Class} {後綴}」→「{專精} {職業} {中文後綴}」
  const TITLE_SUFFIX_TW = Object.freeze({
    'Stats': '屬性',
    'Stat Priority': '屬性優先級',
    'Talent Tree Build': '天賦配置',
    'Recommended Talent Tree Build': '推薦天賦配置',
    'Gear Overview': '裝備總覽',
    'Mythic+ Build': '史詩鑰石配置',
    'Raid Build': '團隊副本配置',
    'Build': '配置',
  });

  // ── 翻譯邏輯 ──────────────────────────────────────────────────────────────

  function translateSpecClassPhrase(phrase) {
    // 把「Frost Mage」或「Frost Death Knight」這類組合翻譯為中文
    // 需要支援兩個字的職業名稱（Death Knight / Demon Hunter / Beast Mastery）
    const trimmed = phrase.trim();
    const translated = [];
    let remaining = trimmed;

    while (remaining.length > 0) {
      let matched = false;
      // 先嘗試比對兩個字的 token（職業名如 "Death Knight"）
      const twoWordMatch = remaining.match(/^(\w+\s+\w+)(.*)/);
      if (twoWordMatch) {
        const twoWord = twoWordMatch[1];
        const rest = twoWordMatch[2].trim();
        const t = CLASS_TW[twoWord] || SPEC_TW[twoWord];
        if (t) {
          translated.push(t);
          remaining = rest;
          matched = true;
        }
      }
      // 再嘗試比對單字 token
      if (!matched) {
        const oneWordMatch = remaining.match(/^(\w+)(.*)/);
        if (oneWordMatch) {
          const oneWord = oneWordMatch[1];
          const rest = oneWordMatch[2].trim();
          const t = SPEC_TW[oneWord] || CLASS_TW[oneWord];
          if (t) {
            translated.push(t);
            remaining = rest;
            matched = true;
          }
        }
      }
      if (!matched) return null;
    }

    return translated.length > 0 ? translated.join(' ') : null;
  }

  // 屬性名稱（用於斜線組合翻譯）
  const STAT_TW = Object.freeze({
    'Intellect': '智力', 'Strength': '力量', 'Agility': '敏捷', 'Stamina': '耐力',
    'Crit': '致命', 'Haste': '加速', 'Mastery': '精通',
    'Versatility': '臨機', 'Vers': '臨機',
  });

  // 翻譯「Mastery / Haste」→「精通 / 加速」這類斜線屬性組合
  function translateStatSlash(text) {
    // 匹配 「Stat / Stat」或「Stat / Stat / Stat」模式
    const parts = text.trim().split(/\s*\/\s*/);
    if (parts.length < 2) return null;
    const translated = parts.map(p => STAT_TW[p.trim()]);
    if (translated.some(t => t === undefined)) return null;
    return text.replace(text.trim(), translated.join(' / '));
  }

  // 從最長後綴開始，避免「Build」先命中「Mythic+ Build」
  const SORTED_SUFFIXES = Object.keys(TITLE_SUFFIX_TW).sort((a, b) => b.length - a.length);

  function translateString(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // 1. 完整比對
    if (EXACT_TW[trimmed] !== undefined) {
      return text.replace(trimmed, EXACT_TW[trimmed]);
    }

    // 2. 純職業或純專精名稱
    if (CLASS_TW[trimmed] !== undefined) {
      return text.replace(trimmed, CLASS_TW[trimmed]);
    }
    if (SPEC_TW[trimmed] !== undefined) {
      return text.replace(trimmed, SPEC_TW[trimmed]);
    }

    // 3. 「{Spec} {Class}」組合（不帶後綴）e.g. "Frost Mage" → "冰霜 法師"
    const combinedTw = translateSpecClassPhrase(trimmed);
    if (combinedTw) {
      return text.replace(trimmed, combinedTw);
    }

    // 3b. 屬性斜線組合 e.g. "Mastery / Haste" → "精通 / 加速"
    const slashTw = translateStatSlash(trimmed);
    if (slashTw) {
      return text.replace(trimmed, slashTw);
    }

    // 4. 動態標題：「{Spec} {Class} {Suffix}」
    //    e.g. "Frost Mage Stats" → "冰霜 法師 屬性"
    for (const suffix of SORTED_SUFFIXES) {
      if (trimmed.endsWith(' ' + suffix)) {
        const prefix = trimmed.slice(0, trimmed.length - suffix.length - 1);
        const prefixTw = translateSpecClassPhrase(prefix);
        if (prefixTw) {
          return text.replace(trimmed, `${prefixTw} ${TITLE_SUFFIX_TW[suffix]}`);
        }
      }
    }

    return null;
  }

  // ── DOM 文字節點掃描 ──────────────────────────────────────────────────────

  // 這些標籤內的文字不翻譯
  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA',
    'CODE', 'PRE', 'SVG', 'INPUT', 'SELECT',
  ]);

  // 不翻譯的 class 關鍵字（避免誤改能力名稱、物品名稱）
  // 注意：不加 'tooltip'，Archon 自己的 tooltip 需要翻譯；Wowhead tooltip 是外部 widget 無法控制
  const SKIP_CLASS_KEYWORDS = [
    'item-name', 'ability-name', 'spell-name',
    'wowhead', 'WhTooltip',
  ];

  function shouldSkipElement(el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    const cls = el.className || '';
    if (typeof cls === 'string' && SKIP_CLASS_KEYWORDS.some(k => cls.includes(k))) return true;
    return false;
  }

  // 用 WeakMap 記錄每個文字節點「最後一次處理時的內容」。
  // 好處：同一個 text node 若被 React 更新內容，會被重新翻譯；
  // 同內容重複 observer 觸發則會被跳過，降低重複掃描成本。
  let translatedNodeText = new WeakMap();

  function walkTextNodes(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          let el = parent;
          while (el && el !== root) {
            if (shouldSkipElement(el)) return NodeFilter.FILTER_REJECT;
            el = el.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const updates = [];
    let node;
    while ((node = walker.nextNode())) {
      const orig = node.textContent;
      if (translatedNodeText.get(node) === orig) continue;

      const translated = translateString(orig);
      if (translated !== null && translated !== orig) {
        updates.push({ node, translated });
      } else {
        translatedNodeText.set(node, orig);
      }
    }
    for (const { node, translated } of updates) {
      node.textContent = translated;
      translatedNodeText.set(node, translated);
    }
  }

  // ── 特定元素處理 ──────────────────────────────────────────────────────────

  /**
   * 翻譯麵包屑選單中的職業/專精名稱。
   * 使用穩定選擇器：
   *   - span.do-not-change-color-on-hover  (專精名稱 icon label)
   *   - nav[aria-label="Breadcrumb"] a     (麵包屑連結文字)
   */
  function translateBreadcrumbs() {
    // 專精選單中的 icon 標籤（span.do-not-change-color-on-hover 是開發者刻意命名的穩定 class）
    const specLabels = document.querySelectorAll('span.do-not-change-color-on-hover');
    for (const el of specLabels) {
      if (el.childElementCount > 0) continue;
      const t = translateString(el.textContent);
      if (t && t !== el.textContent) el.textContent = t;
    }

    // 麵包屑導覽列中的連結（取出純文字節點，忽略 SVG 子元素）
    const nav = document.querySelector('nav[aria-label="Breadcrumb"]');
    if (nav) {
      walkTextNodes(nav);
    }
  }

  // ── Wowhead 繁體中文連結修正 ──────────────────────────────────────────────
  // Archon 的天賦節點和裝備連結指向簡體或英文的 Wowhead。
  // 改成繁中語系網址並設 data-wh-rename-link="true" 後，
  // Wowhead widget ($WowheadPower.refreshLinks) 會自動換成繁體中文名稱和 tooltip。

  let wowheadRefreshTimer = null;
  let wowheadRefreshRetries = 0;
  const MAX_WOWHEAD_RETRIES = 30;

  function queueWowheadRefresh() {
    if (wowheadRefreshTimer !== null) return;
    wowheadRefreshTimer = window.setTimeout(() => {
      wowheadRefreshTimer = null;
      const power = window.$WowheadPower;
      if (power && typeof power.refreshLinks === 'function') {
        wowheadRefreshRetries = 0;
        power.refreshLinks();
      } else if (wowheadRefreshRetries < MAX_WOWHEAD_RETRIES) {
        wowheadRefreshRetries++;
        queueWowheadRefresh();
      }
    }, 80);
  }

  // Wowhead 改版後語系從子網域（tw.wowhead.com）改成路徑前綴（www.wowhead.com/tw/），
  // 舊的子網域改寫已經無法讓 widget 判斷語系，所以統一正規化成新格式。
  const WOWHEAD_HOST = /(?:^|\.)wowhead\.com$/i;
  const WOWHEAD_LOCALE_SEGMENTS = new Set([
    'www', 'en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ko', 'cn', 'tw',
  ]);
  // 遊戲版本前綴要保留，語系段必須插在它後面（例：/classic/tw/item=123）
  const WOWHEAD_GAME_VERSIONS = new Set([
    'classic', 'era', 'tbc', 'wotlk', 'cata', 'mop', 'wod', 'ptr', 'ptr-2', 'beta',
  ]);
  const TW_LOCALE = 'tw';

  function toTwWowheadUrl(hrefLike) {
    let url;
    try {
      url = new URL(hrefLike, window.location.href);
    } catch (_) {
      return null;
    }
    if (!WOWHEAD_HOST.test(url.hostname)) return null;

    url.protocol = 'https:';
    url.hostname = 'www.wowhead.com';

    const segments = url.pathname.split('/').filter(Boolean);
    let localeIndex = 0;
    if (segments.length > 0 && WOWHEAD_GAME_VERSIONS.has(segments[0].toLowerCase())) {
      localeIndex = 1;
    }
    // 移掉既有語系段（可能是 cn / de / www…），再插入 tw；已經是 tw 時結果不變
    if (segments.length > localeIndex && WOWHEAD_LOCALE_SEGMENTS.has(segments[localeIndex].toLowerCase())) {
      segments.splice(localeIndex, 1);
    }
    segments.splice(localeIndex, 0, TW_LOCALE);

    url.pathname = '/' + segments.join('/');
    return url.toString();
  }

  // data-wowhead 會蓋掉 href 的解析結果，所以只在它已存在時補上 domain=tw，
  // 不自行建立（避免漏掉 href 上的 bonus / ilvl 等參數而顯示錯誤的 tooltip）。
  function applyTwDomainToDataWowhead(link) {
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
    if (changed) link.setAttribute('data-wowhead', parts.join('&'));
    return changed;
  }

  const WOWHEAD_ITEM_PATH = /\/item(?:=|\/)/;
  const WOWHEAD_SPELL_PATH = /\/spell(?:=|\/)/;

  function patchWowheadLinks(root = document) {
    const links = root.querySelectorAll('a[href*="wowhead.com"]');
    let touched = false;
    for (const link of links) {
      const href = link.href || '';
      if (!WOWHEAD_ITEM_PATH.test(href) && !WOWHEAD_SPELL_PATH.test(href)) continue;

      const newHref = toTwWowheadUrl(href);
      if (!newHref) continue;
      if (newHref !== href) {
        link.href = newHref;
        touched = true;
      }

      if (applyTwDomainToDataWowhead(link)) {
        touched = true;
      }

      // 只對 item= 連結加 rename（裝備、寶石、附魔）。
      // spell= 連結是天賦節點，只換語系讓 tooltip 正確，不 rename 避免破壞節點排版。
      const hasText = link.textContent.trim().length > 0;
      if (WOWHEAD_ITEM_PATH.test(newHref) && hasText && link.dataset.whRenameLink !== 'true') {
        link.dataset.whRenameLink = 'true';
        touched = true;
      }
    }

    if (touched) queueWowheadRefresh();
  }

  // ── 主入口 ────────────────────────────────────────────────────────────────

  function runTranslation() {
    walkTextNodes(document.body);
    translateBreadcrumbs();
    patchWowheadLinks(document);
  }

  // document-start 時 body 還不存在，等 DOM ready 再開始
  function startWhenReady() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
      return;
    }

    // 寶石/附魔連結（含圖示）字型縮小，與物品名稱（純文字連結）做視覺區分
    const style = document.createElement('style');
    style.textContent = `
      a[href*="/item"][data-wh-rename-link="true"]:has(img) {
        font-size: 0.8em !important;
      }
    `;
    document.head.appendChild(style);
    // 等 React 掛載完成後再執行
    let initRetries = 0;
    const initTimer = setInterval(() => {
      initRetries++;
      if (document.querySelector('h1, h2, nav[aria-label]') || initRetries >= 80) {
        clearInterval(initTimer);
        runTranslation();
      }
    }, 100);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href'],
    });
  }

  // MutationObserver：只處理新增的 Element 節點，做局部翻譯
  // 用 debounce 批次處理，避免 React render 期間頻繁觸發
  let pendingRoots = new Set();
  let debounceTimer = null;

  function flushPendingRoots() {
    const roots = pendingRoots;
    pendingRoots = new Set();
    for (const root of roots) {
      if (!document.contains(root)) continue;
      walkTextNodes(root);
    }
    translateBreadcrumbs();
    patchWowheadLinks(document);
  }

  // header / nav 元素判斷：這些區域要立即翻譯，不等 debounce
  function isHeaderNode(node) {
    return node.closest
      ? node.closest('header, nav[aria-label="Breadcrumb"]') !== null
      : false;
  }

  const observer = new MutationObserver((mutations) => {
    let hasNew = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (isHeaderNode(node)) {
          // header/nav 立即翻譯，不走 debounce
          walkTextNodes(node);
          translateBreadcrumbs();
        } else {
          pendingRoots.add(node);
          hasNew = true;
        }
      }
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'href' &&
        mutation.target instanceof HTMLAnchorElement
      ) {
        hasNew = true;
      }
    }
    if (!hasNew) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(flushPendingRoots, 300);
  });

  // ── SPA 路由切換偵測 ──────────────────────────────────────────────────────
  // Next.js 用 history.pushState / replaceState 換頁，不觸發 popstate。
  // 攔截這兩個方法，換頁後延遲做完整重新翻譯。
  let lastUrl = location.href;

  function onUrlChange() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    // 重建 WeakMap，讓換頁後的節點內容重新進入翻譯流程
    translatedNodeText = new WeakMap();
    // React 分多批渲染，多個時間點掃描確保都能翻到
    setTimeout(runTranslation, 200);
    setTimeout(runTranslation, 600);
    setTimeout(runTranslation, 1200);
  }

  const _pushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    _pushState(...args);
    onUrlChange();
  };

  const _replaceState = history.replaceState.bind(history);
  history.replaceState = function (...args) {
    _replaceState(...args);
    onUrlChange();
  };

  window.addEventListener('popstate', onUrlChange);

  startWhenReady();

})();
