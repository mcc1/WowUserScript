// ==UserScript==
// @name         Archon.gg Traditional Chinese
// @namespace    https://www.archon.gg/
// @version      0.7.1
// @description  Translate archon.gg WoW build pages to Traditional Chinese.
// @author       mcc
// @match        https://www.archon.gg/wow/*
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/wowhead-tw-helper.js?v=1.6.1
// @require      https://raw.githubusercontent.com/mcc1/WowUserScript/master/libs/game-names-tw.js?v=2
// @updateURL    https://raw.githubusercontent.com/mcc1/WowUserScript/master/archon-zh-hant.user.js
// @downloadURL  https://raw.githubusercontent.com/mcc1/WowUserScript/master/archon-zh-hant.user.js
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // ── 翻譯表 ────────────────────────────────────────────────────────────────

  // 職業／專精／種族／英雄天賦的譯名不手寫，一律取自 libs/game-names-tw.js
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

  /**
   * archon 需要用英文名做前綴比對（把「Frost Mage」拆成專精 + 職業），
   * 因此在啟動時用官方英文名清單組出對照表。這裡沒有任何人工翻譯。
   */
  function buildUnitMap(group) {
    const table = gameNames();
    const list = table && table.UNIT_LISTS ? table.UNIT_LISTS[group] : null;
    const map = {};
    if (!Array.isArray(list)) return map;
    for (const english of list) {
      const tw = lookupGameUnit(english);
      if (tw) map[english] = tw;
    }
    return map;
  }

  const CLASS_TW = buildUnitMap('classes');
  const SPEC_TW = buildUnitMap('specs');

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
    'Mythic+': '傳奇鑰石',
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

    // 天賦 tooltip 固定欄位
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

    // 排行／強度排行頁
    // Role：暴雪官方職業頁只列出坦克／治療者／傷害三個值，沒有給這三者一個
    // 上位詞。「職務」取自遊戲內團隊搜尋器，屬非官方查證。不用「角色」——
    // WoW 的角色一律指 character（見 bloodmallet 的 Character profile 角色配置）。
    'Role': '職務',
    'Specialization': '專精',
    'M+ Score': '傳奇鑰石分數',
    'Parses': '解析',
    'Score': '分數',
    'Tier': '階級',
    'Disclaimers & FAQ': '免責聲明 & 常見問題',
    "What's this?": '這是什麼？',
    'Open Menu': '開啟選單',
    'Close Ad': '關閉廣告',

    // 遊戲版本選單
    'WoW - Midnight': 'WoW - 至暗之夜',
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
    'Mythic+ Build': '傳奇鑰石配置',
    'Raid Build': '團隊副本配置',
    'Mythic+ Overview': '傳奇鑰石總覽',
    'Raid Overview': '團隊副本總覽',
    'Weapons & Trinkets': '武器 & 飾品',
    'Enchants & Gems': '附魔 & 寶石',
    'Consumables': '消耗品',
    'Tier Set': '套裝',
    'Rotation': '迴圈',
    'Overview': '總覽',
    'Talents': '天賦',
    'Tier List': '強度排行',
    'Build': '配置',
  });

  const SORTED_SUFFIXES = Object.keys(TITLE_SUFFIX_TW).sort((a, b) => b.length - a.length);

  const SORTED_CLASSES = Object.keys(CLASS_TW).sort((a, b) => b.length - a.length);
  const SORTED_SPECS = Object.keys(SPEC_TW).sort((a, b) => b.length - a.length);

  function translateSpecClassPhrase(text) {
    for (const spec of SORTED_SPECS) {
      if (text.startsWith(spec + ' ')) {
        const afterSpec = text.slice(spec.length + 1);
        for (const cls of SORTED_CLASSES) {
          if (afterSpec === cls) {
            return `${SPEC_TW[spec]} ${CLASS_TW[cls]}`;
          }
        }
      }
    }
    return null;
  }

  const STAT_MAP = Object.freeze({
    'Crit': '致命',
    'Haste': '加速',
    'Mastery': '精通',
    'Versatility': '臨機',
    'Vers': '臨機',
    'Intellect': '智力',
    'Strength': '力量',
    'Agility': '敏捷',
    'Stamina': '耐力',
  });

  function translateStatSlash(text) {
    const parts = text.split(/\s*\/\s*/);
    if (parts.length < 2) return null;
    const translated = parts.map(p => STAT_MAP[p.trim()] || null);
    if (translated.some(t => t === null)) return null;
    return translated.join(' / ');
  }

  // ── 排行頁樣板 ────────────────────────────────────────────────────────────
  // 排行頁標題是樣板組出來的：{職責} {區段} for {鑰石範圍} {內容}。職責 3 種 ×
  // 區段 2 種 × 內容 2 種，而鑰石範圍還隨篩選器變動 —— 把組合寫進 EXACT_TW 會
  // 爆炸，而且使用者一換篩選就失效。跟 translateSpecClassPhrase 同樣走樣式比對。

  const ROLE_TW = Object.freeze({
    'DPS': 'DPS',
    'Tank': '坦克',
    'Healer': '治療者',
  });

  const RANKING_SECTION_TW = Object.freeze({
    'Tier List': '強度排行',
    'Rankings': '排行榜',
  });

  const CONTENT_TW = Object.freeze({
    'Mythic+': '傳奇鑰石',
    'Raid': '團隊副本',
  });

  // 資料片名不另開字典 —— 從既有的遊戲版本選單項目推出來，免得兩處要同步。
  const EXPANSION_PREFIX = 'WoW - ';
  const EXPANSION_TW = Object.freeze(Object.fromEntries(
    Object.entries(EXACT_TW)
      .filter(([en]) => en.startsWith(EXPANSION_PREFIX))
      .map(([en, tw]) => [en.slice(EXPANSION_PREFIX.length), tw.slice(EXPANSION_PREFIX.length)])
  ));

  const TIME_UNIT_TW = Object.freeze({
    second: '秒', minute: '分鐘', hour: '小時',
    day: '天', week: '週', month: '個月', year: '年',
  });

  const KEY_RANGE_RE = /^\+(\d+)\s+to\s+\+(\d+)$/;
  const RELATIVE_TIME_RE = /^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i;
  const RANKING_HEADING_RE = /^(DPS|Tank|Healer)\s+(Tier List|Rankings)\s+for\s+(.+?)\s+(Mythic\+|Raid)$/;
  const PAGE_TITLE_RE = /^(\S+)\s+(DPS|Tank|Healer)\s+(Tier List|Rankings)\s+and\s+(Mythic\+|Raid)\s+(Tier List|Rankings)$/;

  /**
   * 依正體中文排版慣例接字：中西文之間補一個半形空格，中文與中文之間不補。
   * 直接用空格串會得到「傳奇鑰石 坦克 排行榜」這種被切碎的讀感，
   * 直接相接又會得到「DPS排行榜」這種黏住的西文。
   */
  function joinTw(...parts) {
    return parts.filter(Boolean).reduce((acc, part) => {
      if (!acc) return part;
      const needsSpace = /[A-Za-z0-9+]$/.test(acc) || /^[A-Za-z0-9+]/.test(part);
      return acc + (needsSpace ? ' ' : '') + part;
    }, '');
  }

  /** 「+7 to +19」→「+7 到 +19」 */
  function translateKeyRange(text) {
    const match = text.match(KEY_RANGE_RE);
    return match ? `+${match[1]} 到 +${match[2]}` : null;
  }

  /** 「1 day ago」→「1 天前」 */
  function translateRelativeTime(text) {
    const match = text.match(RELATIVE_TIME_RE);
    if (!match) return null;
    const unit = TIME_UNIT_TW[match[2].toLowerCase()];
    return unit ? `${match[1]} ${unit}前` : null;
  }

  /** 「DPS Tier List for +7 to +19 Mythic+」→「+7 到 +19 傳奇鑰石 DPS 強度排行」 */
  function translateRankingHeading(text) {
    const match = text.match(RANKING_HEADING_RE);
    if (!match) return null;
    const range = translateKeyRange(match[3]) || match[3];
    return joinTw(range, CONTENT_TW[match[4]], ROLE_TW[match[1]], RANKING_SECTION_TW[match[2]]);
  }

  /** 「Midnight DPS Rankings and Mythic+ Tier List」→「至暗之夜 DPS 排行榜與傳奇鑰石強度排行」 */
  function translatePageTitle(text) {
    const match = text.match(PAGE_TITLE_RE);
    if (!match) return null;
    const expansion = EXPANSION_TW[match[1]];
    if (!expansion) return null;
    return joinTw(expansion, ROLE_TW[match[2]], RANKING_SECTION_TW[match[3]])
      + '與' + joinTw(CONTENT_TW[match[4]], RANKING_SECTION_TW[match[5]]);
  }

  function translateString(text) {
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed) return null;

    if (EXACT_TW[trimmed] !== undefined) {
      return text.replace(trimmed, EXACT_TW[trimmed]);
    }
    if (CLASS_TW[trimmed] !== undefined) {
      return text.replace(trimmed, CLASS_TW[trimmed]);
    }
    if (SPEC_TW[trimmed] !== undefined) {
      return text.replace(trimmed, SPEC_TW[trimmed]);
    }

    // 英雄天賦樹、種族等其他遊戲資料
    const unitTw = lookupGameUnit(trimmed);
    if (unitTw) {
      return text.replace(trimmed, unitTw);
    }

    const combinedTw = translateSpecClassPhrase(trimmed);
    if (combinedTw) {
      return text.replace(trimmed, combinedTw);
    }

    const slashTw = translateStatSlash(trimmed);
    if (slashTw) {
      return text.replace(trimmed, slashTw);
    }

    for (const suffix of SORTED_SUFFIXES) {
      if (trimmed.endsWith(' ' + suffix)) {
        const prefix = trimmed.slice(0, trimmed.length - suffix.length - 1);
        const prefixTw = translateSpecClassPhrase(prefix);
        if (prefixTw) {
          return text.replace(trimmed, `${prefixTw} ${TITLE_SUFFIX_TW[suffix]}`);
        }
      }
    }

    const templated = translateRankingHeading(trimmed)
      || translatePageTitle(trimmed)
      || translateKeyRange(trimmed)
      || translateRelativeTime(trimmed);
    if (templated) {
      return text.replace(trimmed, templated);
    }

    return null;
  }

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA',
    'CODE', 'PRE', 'SVG', 'INPUT', 'SELECT',
  ]);

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

  function translateBreadcrumbs() {
    const specLabels = document.querySelectorAll('span.do-not-change-color-on-hover');
    for (const el of specLabels) {
      if (el.childElementCount > 0) continue;
      const t = translateString(el.textContent);
      if (t && t !== el.textContent) el.textContent = t;
    }

    const nav = document.querySelector('nav[aria-label="Breadcrumb"]');
    if (nav) {
      walkTextNodes(nav);
    }
  }

  // ── 初始化 WowheadTwHelper ────────────────────────────────────────────────
  const helper = new window.WowheadTwHelper({
    enableRenameLinks: true,
    enableSafeLinkify: false,
    onScan: (root) => {
      walkTextNodes(root);
      translateBreadcrumbs();
    },
    onUrlChange: () => {
      translatedNodeText = new WeakMap();
      if (document.body) {
        helper.runFullPass();
      }
    },
  });

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

    helper.start();
  }

  startWhenReady();
})();
